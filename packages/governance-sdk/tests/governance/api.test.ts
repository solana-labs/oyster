

import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { BN } from 'bn.js';
import { createInstructionData, getGovernanceProgramVersion, getInstructionDataFromBase64, getRealm, getRealms, getTokenOwnerRecordsByOwner, GovernanceConfig, MintMaxVoteWeightSource, PROGRAM_VERSION_V2, serializeInstructionToBase64, VoteThresholdPercentage, VoteType, VoteWeightSource, withAddSignatory, withCreateMintGovernance, withCreateProposal, withCreateRealm, withDepositGoverningTokens, withInsertInstruction, withSignOffProposal } from '../../src'
import { requestAirdrop, sendTransaction } from '../tools/sdk';
import { getTimestampFromDays } from '../tools/units';
import { withCreateAssociatedTokenAccount } from '../tools/withCreateAssociatedTokenAccount';
import { withCreateMint } from '../tools/withCreateMint';
import { withMintTo } from '../tools/withMintTo';


const programId = new PublicKey("BfFUxwBiJLhD1wL36xGXWRe7RXAFL4QKircHydAHS3wt")

const rpcEndpoint = clusterApiUrl('devnet')
const connection = new Connection(rpcEndpoint, 'recent')


test('createRealmWithGovernanceAndProposal', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  // Get governance program version 
  const programVersion = await getGovernanceProgramVersion(connection, programId);

  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = []

  // Create and mint governance token
  let mintPk = await withCreateMint(connection, instructions, signers, walletPk, walletPk, 0, walletPk)

  let ataPk = await withCreateAssociatedTokenAccount(instructions, mintPk, walletPk, walletPk);
  await withMintTo(instructions, mintPk, ataPk, walletPk, 1)

  // Create Realm
  const name = `Realm-${new Keypair().publicKey.toBase58().slice(0, 6)}`;
  const realmAuthorityPk = walletPk;

  const realmPk = await withCreateRealm(instructions, programId, programVersion, name, realmAuthorityPk, mintPk, walletPk, undefined, MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION, new BN(1), undefined)

  // Deposit governance tokens
  const tokenOwnerRecordPk = await withDepositGoverningTokens(instructions, programId, programVersion, realmPk, ataPk, mintPk, walletPk, walletPk, walletPk, new BN(1));

  // Crate governance over the the governance token mint
  const config = new GovernanceConfig({
    voteThresholdPercentage: new VoteThresholdPercentage({
      value: 60,
    }),
    minCommunityTokensToCreateProposal: new BN(1),
    minInstructionHoldUpTime: 0,
    maxVotingTime: getTimestampFromDays(3),
    voteWeightSource: VoteWeightSource.Deposit,
    proposalCoolOffTime: 0,
    minCouncilTokensToCreateProposal: new BN(1),
  })

  const governancePk = await withCreateMintGovernance(instructions, programId, realmPk, mintPk, config, true, walletPk, tokenOwnerRecordPk, walletPk, walletPk, undefined)

  // Create single choice Approve/Deny proposal with instruction to mint more governance tokens
  const voteType = VoteType.SINGLE_CHOICE
  const options = ['Approve']
  const useDenyOption = true

  const proposalPk = await withCreateProposal(instructions, programId, programVersion, realmPk, governancePk, tokenOwnerRecordPk, "proposal 1", "", mintPk, walletPk, 0, voteType, options, useDenyOption, walletPk)

  const instruction = Token.createMintToInstruction(
    TOKEN_PROGRAM_ID,
    mintPk,
    ataPk,
    governancePk,
    [],
    1
  )

  const instructionData = createInstructionData(instruction);

  await withInsertInstruction(instructions, programId, programVersion, governancePk, proposalPk, tokenOwnerRecordPk, walletPk, 0, 0, instructionData, walletPk)

  // Act
  await sendTransaction(connection, instructions, signers, wallet);

  // Assert 
  const realm = await getRealm(connection, realmPk);
  expect(realm.account.name).toBe(name);

  const results = await getTokenOwnerRecordsByOwner(connection, programId, walletPk)

  expect(results.length).toBe(1);
  expect(results[0].account.governingTokenOwner).toEqual(walletPk)

})