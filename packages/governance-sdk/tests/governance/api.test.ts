import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import {
  createInstructionData,
  getGovernance,
  getGovernanceProgramVersion,
  getProposal,
  getRealm,
  getTokenOwnerRecordsByOwner,
  GovernanceConfig,
  MintMaxVoteWeightSource,
  SetRealmAuthorityAction,
  Vote,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
  VoteType,
  withCastVote,
  withCreateMintGovernance,
  withCreateProposal,
  withCreateRealm,
  withDepositGoverningTokens,
  withInsertTransaction,
  withSetRealmAuthority,
  withSignOffProposal,
  YesNoVote,
} from '../../src';
import { requestAirdrop, sendTransaction } from '../tools/sdk';
import { programId, rpcEndpoint } from '../tools/setup';
import { getTimestampFromDays } from '../tools/units';
import { withCreateAssociatedTokenAccount } from '../tools/withCreateAssociatedTokenAccount';
import { withCreateMint } from '../tools/withCreateMint';
import { withMintTo } from '../tools/withMintTo';

const connection = new Connection(rpcEndpoint, 'recent');

test('createRealmWithGovernanceAndProposal', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  // Get governance program version
  const programVersion = await getGovernanceProgramVersion(
    connection,
    programId,
  );

  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  // Create and mint governance token
  let mintPk = await withCreateMint(
    connection,
    instructions,
    signers,
    walletPk,
    walletPk,
    0,
    walletPk,
  );

  let ataPk = await withCreateAssociatedTokenAccount(
    instructions,
    mintPk,
    walletPk,
    walletPk,
  );
  await withMintTo(instructions, mintPk, ataPk, walletPk, 1);

  // Create Realm
  const name = `Realm-${new Keypair().publicKey.toBase58().slice(0, 6)}`;
  const realmAuthorityPk = walletPk;

  const realmPk = await withCreateRealm(
    instructions,
    programId,
    programVersion,
    name,
    realmAuthorityPk,
    mintPk,
    walletPk,
    undefined,
    MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
    new BN(1),
    undefined,
  );

  // Deposit governance tokens
  const tokenOwnerRecordPk = await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realmPk,
    ataPk,
    mintPk,
    walletPk,
    walletPk,
    walletPk,
    new BN(1),
  );

  // Crate governance over the the governance token mint

  let communityVoteThreshold = new VoteThreshold({
    type: VoteThresholdType.YesVotePercentage,
    value: 60,
  });

  let councilVoteThreshold = new VoteThreshold({
    type: VoteThresholdType.YesVotePercentage,
    // For VERSION < 3 we have to pass 0
    value: programVersion >= 3 ? 10 : 0,
  });

  let councilVetoVoteThreshold = new VoteThreshold({
    type: VoteThresholdType.YesVotePercentage,
    // For VERSION < 3 we have to pass 0
    value: programVersion >= 3 ? 10 : 0,
  });

  const config = new GovernanceConfig({
    communityVoteThreshold: communityVoteThreshold,
    minCommunityTokensToCreateProposal: new BN(1),
    minInstructionHoldUpTime: 0,
    baseVotingTime: getTimestampFromDays(3),
    communityVoteTipping: VoteTipping.Strict,
    councilVoteTipping: VoteTipping.Strict,
    minCouncilTokensToCreateProposal: new BN(1),
    councilVoteThreshold: councilVoteThreshold,
    councilVetoVoteThreshold: councilVetoVoteThreshold,
    communityVetoVoteThreshold: councilVetoVoteThreshold,
    votingCoolOffTime: 0,
    depositExemptProposalCount: 0,
  });

  const governancePk = await withCreateMintGovernance(
    instructions,
    programId,
    programVersion,
    realmPk,
    mintPk,
    config,
    true,
    walletPk,
    tokenOwnerRecordPk,
    walletPk,
    walletPk,
    undefined,
  );

  console.log('SET AUTHORITY');

  // Set realm authority to the created governance
  withSetRealmAuthority(
    instructions,
    programId,
    programVersion,
    realmPk,
    walletPk,
    governancePk,
    SetRealmAuthorityAction.SetChecked,
  );

  // Create single choice Approve/Deny proposal with instruction to mint more governance tokens
  const voteType = VoteType.SINGLE_CHOICE;
  const options = ['Approve'];
  const useDenyOption = true;

  const proposalPk = await withCreateProposal(
    instructions,
    programId,
    programVersion,
    realmPk,
    governancePk,
    tokenOwnerRecordPk,
    'proposal 1',
    '',
    mintPk,
    walletPk,
    0,
    voteType,
    options,
    useDenyOption,
    walletPk,
  );

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

  const instruction = Token.createMintToInstruction(
    TOKEN_PROGRAM_ID,
    mintPk,
    ataPk,
    governancePk,
    [],
    1,
  );

  const instructionData = createInstructionData(instruction);

  await withInsertTransaction(
    instructions,
    programId,
    programVersion,
    governancePk,
    proposalPk,
    tokenOwnerRecordPk,
    walletPk,
    0,
    0,
    0,
    [instructionData, instructionData],
    walletPk,
  );

  withSignOffProposal(
    instructions,
    programId,
    programVersion,
    realmPk,
    governancePk,
    proposalPk,
    walletPk,
    undefined,
    tokenOwnerRecordPk,
  );

  await sendTransaction(connection, instructions, signers, wallet);

  // Cast Vote
  instructions = [];
  signers = [];

  const vote = Vote.fromYesNoVote(YesNoVote.Yes);

  const votePk = await withCastVote(
    instructions,
    programId,
    programVersion,
    realmPk,
    governancePk,
    proposalPk,
    tokenOwnerRecordPk, // Proposal owner TokenOwnerRecord
    tokenOwnerRecordPk, // Voter TokenOwnerRecord
    walletPk, // Voter wallet or delegate
    mintPk,
    vote,
    walletPk,
  );

  await sendTransaction(connection, instructions, signers, wallet);

  // Act

  // Assert
  const realm = await getRealm(connection, realmPk);
  expect(realm.account.name).toBe(name);

  const results = await getTokenOwnerRecordsByOwner(
    connection,
    programId,
    walletPk,
  );

  expect(results.length).toBe(1);
  expect(results[0].account.governingTokenOwner).toEqual(walletPk);

  // check governance
  const governance = await getGovernance(connection, governancePk);
  expect(governance.account.config.communityVoteThreshold).toEqual(
    config.communityVoteThreshold,
  );
  // expect(governance.account.config.councilVoteThreshold).toEqual(config.councilVoteThreshold);

  // check proposal
  const proposal = await getProposal(connection, proposalPk);
});
