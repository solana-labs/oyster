import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  getGovernance,
  getProposal,
  getProposalDepositsByDepositPayer,
  getRealm,
  getRealmConfig,
  getTokenOwnerRecord,
  getVoteRecord,
  Vote,
  withAddSignatory,
  withCastVote,
  withCreateGovernance,
  withCreateProposal,
  withDepositGoverningTokens,
  withRefundProposalDeposit,
  withRelinquishVote,
  withRevokeGoverningTokens,
  withSignOffProposal,
  withWithdrawGoverningTokens,
  YesNoVote,
} from '../../src';
import {
  getRealmConfigAddress,
  GovernanceConfig,
  GoverningTokenConfigAccountArgs,
  GoverningTokenType,
  MintMaxVoteWeightSource,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
  VoteType,
} from '../../src/governance/accounts';
import { getGovernanceProgramVersion } from '../../src/governance/version';
import { withCreateRealm } from '../../src/governance/withCreateRealm';
import { withSetRealmConfig } from '../../src/governance/withSetRealmConfig';
import { requestAirdrop, sendTransaction } from './sdk';
import { rpcEndpoint, rpcProgramId } from './setup';
import { getTimestampFromDays } from './units';
import { withCreateAssociatedTokenAccount } from './withCreateAssociatedTokenAccount';
import { withCreateMint } from './withCreateMint';
import { withMintTo } from './withMintTo';

export class BenchBuilder {
  connection: Connection;
  programId: PublicKey;
  programVersion: number;

  wallet: Keypair;
  walletPk: PublicKey;

  instructions: TransactionInstruction[] = [];
  signers: Keypair[] = [];

  constructor(
    connection: Connection,
    programId: PublicKey,
    programVersion: number,
  ) {
    this.connection = connection;
    this.programId = programId;
    this.programVersion = programVersion;
  }

  static async withConnection(
    requiredProgramVersion?: number | undefined,
    connection?: Connection | undefined,
    programId?: PublicKey | undefined,
  ) {
    connection = connection ?? new Connection(rpcEndpoint, 'recent');
    programId = programId ?? rpcProgramId;

    const programVersion = await getGovernanceProgramVersion(
      connection,
      programId,
    );

    if (requiredProgramVersion && programVersion != requiredProgramVersion) {
      throw new Error(
        `Program VERSION: ${programVersion} detected while VERSION: ${requiredProgramVersion} is required for the test`,
      );
    }

    return new BenchBuilder(connection, programId, programVersion);
  }

  async withWallet() {
    this.wallet = Keypair.generate();
    this.walletPk = this.wallet.publicKey;

    await requestAirdrop(this.connection, this.walletPk);
    await new Promise(f => setTimeout(f, 1000));

    return this;
  }

  async sendTx() {
    await sendTransaction(
      this.connection,
      this.instructions,
      this.signers,
      this.wallet,
    );
    this.instructions = [];
    this.signers = [];

    return this;
  }

  async withRealm(
    communityTokenConfig?: GoverningTokenConfigAccountArgs | undefined,
    councilTokenConfig?: GoverningTokenConfigAccountArgs | undefined,
  ) {
    return new RealmBuilder(this).withRealm(
      communityTokenConfig,
      councilTokenConfig,
    );
  }
}

export class RealmBuilder {
  bench: BenchBuilder;

  realmPk: PublicKey;
  realmAuthorityPk: PublicKey;
  communityMintPk: PublicKey;
  councilMintPk: PublicKey;

  communityOwnerRecordPk: PublicKey;
  governancePk: PublicKey;
  proposalPk: PublicKey;
  signatoryPk: PublicKey | undefined;
  voteRecordPk: PublicKey;

  constructor(bench: BenchBuilder) {
    this.bench = bench;
  }

  async withRealm(
    communityTokenConfig?: GoverningTokenConfigAccountArgs | undefined,
    councilTokenConfig?: GoverningTokenConfigAccountArgs | undefined,
  ) {
    const name = `Realm-${new Keypair().publicKey.toBase58().slice(0, 6)}`;
    this.realmAuthorityPk = this.bench.walletPk;

    // Create community token
    this.communityMintPk = await withCreateMint(
      this.bench.connection,
      this.bench.instructions,
      this.bench.signers,
      this.bench.walletPk,
      this.bench.walletPk,
      0,
      this.bench.walletPk,
    );

    // Create council
    this.councilMintPk = await withCreateMint(
      this.bench.connection,
      this.bench.instructions,
      this.bench.signers,
      this.bench.walletPk,
      this.bench.walletPk,
      0,
      this.bench.walletPk,
    );

    const communityMintMaxVoteWeightSource =
      MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;

    this.realmPk = await withCreateRealm(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      name,
      this.realmAuthorityPk,
      this.communityMintPk,
      this.bench.walletPk,
      this.councilMintPk,
      communityMintMaxVoteWeightSource,
      new BN(1),
      communityTokenConfig,
      councilTokenConfig,
    );

    return this;
  }

  async getRealm() {
    return getRealm(this.bench.connection, this.realmPk);
  }

  async setRealmConfig(
    communityTokenConfig?: GoverningTokenConfigAccountArgs | undefined,
    councilTokenConfig?: GoverningTokenConfigAccountArgs | undefined,
  ) {
    const communityMintMaxVoteWeightSource =
      MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;

    communityTokenConfig =
      communityTokenConfig ??
      new GoverningTokenConfigAccountArgs({
        voterWeightAddin: Keypair.generate().publicKey,
        maxVoterWeightAddin: Keypair.generate().publicKey,
        tokenType: GoverningTokenType.Liquid,
      });

    await withSetRealmConfig(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      this.bench.walletPk,
      this.councilMintPk,
      communityMintMaxVoteWeightSource,
      new BN(1),
      communityTokenConfig,
      councilTokenConfig,
      this.bench.walletPk,
    );

    await this.sendTx();
  }

  async getRealmConfig() {
    const realmConfigPk = await getRealmConfigAddress(
      this.bench.programId,
      this.realmPk,
    );
    return getRealmConfig(this.bench.connection, realmConfigPk);
  }

  async withCommunityMember() {
    let ataPk = await withCreateAssociatedTokenAccount(
      this.bench.instructions,
      this.communityMintPk,
      this.bench.walletPk,
      this.bench.walletPk,
    );
    await withMintTo(
      this.bench.instructions,
      this.communityMintPk,
      ataPk,
      this.bench.walletPk,
      1,
    );

    this.communityOwnerRecordPk = await withDepositGoverningTokens(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      ataPk,
      this.communityMintPk,
      this.bench.walletPk,
      this.bench.walletPk,
      this.bench.walletPk,
      new BN(1),
    );

    return this;
  }

  async withdrawGoverningTokens() {
    const ataPk = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      this.communityMintPk,
      this.bench.walletPk,
    );

    await withWithdrawGoverningTokens(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      ataPk,
      this.communityMintPk,
      this.bench.walletPk,
    );

    await this.sendTx();
  }

  async revokeGoverningTokens() {
    await withRevokeGoverningTokens(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,

      this.realmPk,
      this.bench.walletPk,
      this.communityMintPk,
      this.bench.walletPk,
      new BN(1),
    );

    await this.sendTx();
  }

  async getTokenOwnerRecord(tokenOwnerRecordPk: PublicKey) {
    return getTokenOwnerRecord(this.bench.connection, tokenOwnerRecordPk);
  }

  async withGovernance(config?: GovernanceConfig | undefined) {
    await this._createGovernance(config);
    return this;
  }

  async createGovernance(config?: GovernanceConfig | undefined) {
    const governancePk = await this._createGovernance(config);
    await this.sendTx();
    return governancePk;
  }

  async _createGovernance(config?: GovernanceConfig | undefined) {
    config =
      config ??
      new GovernanceConfig({
        communityVoteThreshold: new VoteThreshold({
          type: VoteThresholdType.YesVotePercentage,
          value: 60,
        }),
        minCommunityTokensToCreateProposal: new BN(1),
        minInstructionHoldUpTime: 0,
        baseVotingTime: getTimestampFromDays(3),
        communityVoteTipping: VoteTipping.Strict,
        councilVoteTipping: VoteTipping.Strict,
        minCouncilTokensToCreateProposal: new BN(1),
        councilVoteThreshold: new VoteThreshold({
          type: VoteThresholdType.YesVotePercentage,
          // For VERSION < 3 we have to pass 0
          value: this.bench.programVersion >= 3 ? 10 : 0,
        }),
        councilVetoVoteThreshold: new VoteThreshold({
          type: VoteThresholdType.YesVotePercentage,
          // For VERSION < 3 we have to pass 0
          value: this.bench.programVersion >= 3 ? 10 : 0,
        }),
        communityVetoVoteThreshold: new VoteThreshold({
          type: VoteThresholdType.YesVotePercentage,
          value: 80,
        }),
        votingCoolOffTime: 0,
        depositExemptProposalCount: 0,
      });

    const governedAccountPk = Keypair.generate().publicKey;

    this.governancePk = await withCreateGovernance(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      governedAccountPk,
      config,
      this.communityOwnerRecordPk,
      this.bench.walletPk,
      this.bench.walletPk,
      undefined,
    );

    return this.governancePk;
  }

  async getGovernance(governancePk: PublicKey) {
    return getGovernance(this.bench.connection, governancePk);
  }

  async withProposal(name?: string) {
    await this._createProposal(name);
    return this;
  }

  async createProposal(name?: string, multiple?: boolean) {
    const proposalPk = await this._createProposal(name, multiple);
    await this.sendTx();
    return proposalPk;
  }

  async _createProposal(name?: string, multiple?: boolean) {
    // Create single choice Approve/Deny proposal with instruction to mint more governance tokens
    let voteType = VoteType.SINGLE_CHOICE;
    let options = ['Approve'];
    let useDenyOption = true;

    if (multiple) {
      voteType = VoteType.MULTI_CHOICE(4);
      options = ['One', 'Two', 'Three', 'four']
      useDenyOption = false
    }

    this.proposalPk = await withCreateProposal(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      this.governancePk,
      this.communityOwnerRecordPk,
      name ?? 'proposal 1',
      '',
      this.communityMintPk,
      this.bench.walletPk,
      0,
      voteType,
      options,
      useDenyOption,
      this.bench.walletPk,
    );
    return this.proposalPk;
  }

  async getProposal(proposalPk: PublicKey) {
    return getProposal(this.bench.connection, proposalPk);
  }

  async getProposalDeposits(depositPayerPk: PublicKey) {
    return getProposalDepositsByDepositPayer(
      this.bench.connection,
      this.bench.programId,
      depositPayerPk,
    );
  }

  async refundProposalDeposit() {
    await this._refundProposalDeposit();
    await this.sendTx();
  }

  async _refundProposalDeposit() {
    await withRefundProposalDeposit(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.proposalPk,
      this.bench.walletPk,
    );
  }

  async withSignatory() {
    this.signatoryPk = await withAddSignatory(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.proposalPk,
      this.communityOwnerRecordPk,
      this.bench.walletPk,
      this.bench.walletPk,
      this.bench.walletPk,
    );

    return this;
  }

  async withProposalSignOff() {
    withSignOffProposal(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      this.governancePk,
      this.proposalPk,
      this.bench.walletPk,
      this.signatoryPk,
      this.communityOwnerRecordPk,
    );

    return this;
  }

  async withCastVote() {
    await this._castVote();
    return this;
  }

  async castVote() {
    const voteRecordPk = await this._castVote();
    await this.sendTx();
    return voteRecordPk;
  }

  async _castVote() {
    const vote = Vote.fromYesNoVote(YesNoVote.Yes);

    this.voteRecordPk = await withCastVote(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      this.governancePk,
      this.proposalPk,
      this.communityOwnerRecordPk,
      this.communityOwnerRecordPk,
      this.bench.walletPk,
      this.communityMintPk,
      vote,
      this.bench.walletPk,
    );

    return this.voteRecordPk;
  }

  async getVoteRecord(proposalPk: PublicKey) {
    return getVoteRecord(this.bench.connection, proposalPk);
  }

  async relinquishVote() {
    withRelinquishVote(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      this.realmPk,
      this.governancePk,
      this.proposalPk,
      this.communityOwnerRecordPk,
      this.communityMintPk,
      this.voteRecordPk,
      this.bench.walletPk,
      this.bench.walletPk,
    );

    await this.sendTx();
  }

  async sendTx() {
    await this.bench.sendTx();
    return this;
  }
}
