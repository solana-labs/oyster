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
  getGovernanceProgramVersion,
  getRealm,
  GovernanceConfig,
  MintMaxVoteWeightSource,
  VoteThresholdPercentage,
  VoteType,
  VoteTipping,
  withCreateMintGovernance,
  withCreateProposal,
  withCreateRealm,
  withDepositGoverningTokens,
  withInsertTransaction,
  withSetRealmAuthority,
  SetRealmAuthorityAction,
  withRemoveTransaction,
  withSignOffProposal,
  withAddSignatory,
  withCastVote,
  Vote,
  YesNoVote,
  withCancelProposal,
  withFlagTransactionError,
  withWithdrawGoverningTokens,
  withUpdateProgramMetadata,
  withRelinquishVote,
  getAllGovernances,
  getAllProposals,
  getAllTokenOwnerRecords,
  tryGetRealmConfig,
  withExecuteTransaction,
  withSetGovernanceDelegate,
  getTokenOwnerRecordForRealm,
  getTokenOwnerRecord,
} from '../../src';

import { withSetRealmConfig } from '../../src/governance/withSetRealmConfig';
import { requestAirdrop, sendTransaction } from '../tools/sdk';
import { getTimestampFromDays } from '../tools/units';
import { withCreateAssociatedTokenAccount } from '../tools/withCreateAssociatedTokenAccount';
import { withCreateMint } from '../tools/withCreateMint';
import { withMintTo } from '../tools/withMintTo';

const programId = new PublicKey('BfFUxwBiJLhD1wL36xGXWRe7RXAFL4QKircHydAHS3wt');
const rpcEndpoint = clusterApiUrl('devnet');

// const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
// const rpcEndpoint = 'http://127.0.0.1:8899';

const connection = new Connection(rpcEndpoint, 'recent');

test('setupRealm', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  await new Promise(f => setTimeout(f, 1000));

  // options
  const useSignatory = true;
  const cancelProposal = false;

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
  const governanceAuthorityPk = walletPk;
  const communityMintMaxVoteWeightSource =
    MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;
  const councilMintPk = undefined;

  const realmPk = await withCreateRealm(
    instructions,
    programId,
    programVersion,
    name,
    realmAuthorityPk,
    mintPk,
    walletPk,
    councilMintPk,
    communityMintMaxVoteWeightSource,
    new BN(1),
  );

  await withSetRealmConfig(
    instructions,
    programId,
    programVersion,
    realmPk,
    realmAuthorityPk,
    councilMintPk,
    communityMintMaxVoteWeightSource,
    new BN(1),
    undefined,
    undefined,
    walletPk,
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

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

  // Crate governance over the the governance token mint
  const config = new GovernanceConfig({
    voteThresholdPercentage: new VoteThresholdPercentage({
      value: 60,
    }),
    minCommunityTokensToCreateProposal: new BN(1),
    minInstructionHoldUpTime: 0,
    maxVotingTime: getTimestampFromDays(3),
    voteTipping: VoteTipping.Strict,
    proposalCoolOffTime: 0,
    minCouncilTokensToCreateProposal: new BN(1),
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

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

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

  let transactionPk = await withInsertTransaction(
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
    [instructionData],
    walletPk,
  );

  await withRemoveTransaction(
    instructions,
    programId,
    proposalPk,
    tokenOwnerRecordPk,
    walletPk,
    transactionPk,
    walletPk,
  );

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

  transactionPk = await withInsertTransaction(
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
    [instructionData],
    walletPk,
  );

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

  if (useSignatory) {
    const signatoryRecordPk = await withAddSignatory(
      instructions,
      programId,
      programVersion,
      proposalPk,
      tokenOwnerRecordPk,
      governanceAuthorityPk,
      walletPk,
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
      signatoryRecordPk,
      undefined,
    );
  } else {
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
  }

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

  if (cancelProposal) {
    withCancelProposal(
      instructions,
      programId,
      programVersion,
      realmPk,
      governancePk,
      proposalPk,
      tokenOwnerRecordPk,
      governanceAuthorityPk,
    );
  } else {
    const vote = Vote.fromYesNoVote(YesNoVote.Yes);

    const votePk = await withCastVote(
      instructions,
      programId,
      programVersion,
      realmPk,
      governancePk,
      proposalPk,
      tokenOwnerRecordPk,
      tokenOwnerRecordPk,
      governanceAuthorityPk,
      mintPk,
      vote,
      walletPk,
    );

    withRelinquishVote(
      instructions,
      programId,
      governancePk,
      proposalPk,
      tokenOwnerRecordPk,
      mintPk,
      votePk,
      governanceAuthorityPk,
      walletPk,
    );

    await sendTransaction(connection, instructions, signers, wallet);
    instructions = [];
    signers = [];

    await new Promise(f => setTimeout(f, 1000));

    withFlagTransactionError(
      instructions,
      programId,
      programVersion,
      proposalPk,
      tokenOwnerRecordPk,
      governanceAuthorityPk,
      transactionPk,
    );

    await withExecuteTransaction(
      instructions,
      programId,
      programVersion,
      governancePk,
      proposalPk,
      transactionPk,
      [instructionData],
    );
  }

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];

  withWithdrawGoverningTokens(
    instructions,
    programId,
    realmPk,
    ataPk,
    mintPk,
    tokenOwnerRecordPk,
  );

  await withUpdateProgramMetadata(instructions, programId, walletPk);

  // Act
  await sendTransaction(connection, instructions, signers, wallet);

  // Assert
  const realm = await getRealm(connection, realmPk);
  expect(realm.account.name).toBe(name);
});

test('getAllGovernances', async () => {
  // Arrange
  const realmPk = new PublicKey("9BrZiMXAVocFj7wgUaAbt1sMcKUEzHKbMmhgrojUvM9G")

  // Act
  const governances = await getAllGovernances(connection, programId, realmPk);

  // Arrange
  expect(governances.length).toBeGreaterThan(0);


});

test('getAllProposals', async () => {
  // Arrange
  const realmPk = new PublicKey("EDJ6Uc1U51x1SemSygLEjkvtzNMUWMm1wMf4tANQz9Qu")

  // Act
  const proposals = await getAllProposals(connection, programId, realmPk);

  // Arrange
  expect(proposals.length).toBeGreaterThan(0);


});

test('getAllTokenOwnerRecords', async () => {
  // Arrange
  const realmPk = new PublicKey("EDJ6Uc1U51x1SemSygLEjkvtzNMUWMm1wMf4tANQz9Qu")

  // Act
  const tokenOwnerRecords = await getAllTokenOwnerRecords(connection, programId, realmPk);

  // Arrange
  expect(tokenOwnerRecords.length).toBeGreaterThan(0);


});

test('tryGetRealmConfig', async () => {
  // Arrange
  const realmPk = new PublicKey("A98TAf9KwCMMd9GmXogc9D3Lj9diYGkAZctUZZPXEf41")
  const programId = new PublicKey("AuetJrDq4USDLibT83abUB9pniWFQuPsZa3YNYtrqUWP")

  // Act
  const realmConfig = await tryGetRealmConfig(connection,programId,realmPk);

  // Assert
  expect(realmConfig.account.realm).toEqual(realmPk);

});


test('setGovernanceDelegate', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  await new Promise(f => setTimeout(f, 1000));

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
  const communityMintMaxVoteWeightSource =
    MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;
  const councilMintPk = undefined;

  const realmPk = await withCreateRealm(
    instructions,
    programId,
    programVersion,
    name,
    realmAuthorityPk,
    mintPk,
    walletPk,
    councilMintPk,
    communityMintMaxVoteWeightSource,
    new BN(1),
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

  await sendTransaction(connection, instructions, signers, wallet);
  instructions = [];
  signers = [];


  const delegatePk = Keypair.generate().publicKey;

  // Act
  await withSetGovernanceDelegate(instructions,programId,programVersion,realmPk,mintPk,walletPk,walletPk,delegatePk);
  await sendTransaction(connection, instructions, signers, wallet);

  // Assert
  let tokenOwnerRecord = await getTokenOwnerRecord(connection,tokenOwnerRecordPk)

  expect(tokenOwnerRecord.account.governanceDelegate).toEqual(delegatePk);

});


