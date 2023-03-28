import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import {
  ChatMessageBody,
  ChatMessageBodyType,
  getGovernanceChatMessagesByVoter,
  getGovernanceProgramVersion,
  GovernanceConfig,
  MintMaxVoteWeightSource,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
  VoteType,
  withCreateMintGovernance,
  withCreateProposal,
  withCreateRealm,
  withDepositGoverningTokens,
  withPostChatMessage,
} from '../../src';
import { requestAirdrop, sendTransaction } from '../tools/sdk';
import { getTimestampFromDays } from '../tools/units';
import { withCreateAssociatedTokenAccount } from '../tools/withCreateAssociatedTokenAccount';
import { withCreateMint } from '../tools/withCreateMint';
import { withMintTo } from '../tools/withMintTo';

const chatProgramId = new PublicKey(
  '7fjWgipzcHFP3c5TMMWumFHNAL5Eme1gFqqRGnNPbbfG',
);

const rpcEndpoint = clusterApiUrl('devnet');

const governanceProgramId = new PublicKey(
  'BfFUxwBiJLhD1wL36xGXWRe7RXAFL4QKircHydAHS3wt',
);
//const rpcEndpoint = 'http://127.0.0.1:8899';

const connection = new Connection(rpcEndpoint, 'recent');

test('postProposalComment', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  // Get governance program version
  const programVersion = await getGovernanceProgramVersion(
    connection,
    governanceProgramId,
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
    governanceProgramId,
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
    governanceProgramId,
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
  const config = new GovernanceConfig({
    communityVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 60,
    }),
    minCommunityTokensToCreateProposal: new BN(1),
    minInstructionHoldUpTime: 0,
    baseVotingTime: getTimestampFromDays(3),
    voteTipping: VoteTipping.Strict,
    councilVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.Disabled,
    }),
    minCouncilTokensToCreateProposal: new BN(1),
    votingCoolOffTime: 0,
    depositExemptProposalCount: 0,
  });

  const governancePk = await withCreateMintGovernance(
    instructions,
    governanceProgramId,
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

  // Create single choice Approve/Deny proposal with instruction to mint more governance tokens
  const voteType = VoteType.SINGLE_CHOICE;
  const options = ['Approve'];
  const useDenyOption = true;

  const proposalPk = await withCreateProposal(
    instructions,
    governanceProgramId,
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

  // Act

  const chatMessage = new ChatMessageBody({
    type: ChatMessageBodyType.Text,
    value: "Let's do it",
  });

  const messagePk = await withPostChatMessage(
    instructions,
    signers,
    chatProgramId,
    governanceProgramId,
    realmPk,
    governancePk,
    proposalPk,
    tokenOwnerRecordPk,
    walletPk,
    walletPk,
    undefined,
    chatMessage,
  );

  await sendTransaction(connection, instructions, signers, wallet);

  // Assert
  const messages = await getGovernanceChatMessagesByVoter(
    connection,
    chatProgramId,
    walletPk,
  );
  expect(messages.length).toBe(1);

  expect(messages[0].account.body.value).toBe(chatMessage.value);
});
