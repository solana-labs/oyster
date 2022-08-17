import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import {
  getGovernance,
  getGovernanceAccount,
  withCreateGovernance,
  withDepositGoverningTokens,
} from '../../src';
import {
  GovernanceConfig,
  MintMaxVoteWeightSource,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
} from '../../src/governance/accounts';
import { getGovernanceProgramVersion } from '../../src/governance/version';
import { withCreateRealm } from '../../src/governance/withCreateRealm';
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
    connection?: Connection | undefined,
    programId?: PublicKey | undefined,
  ) {
    connection = connection ?? new Connection(rpcEndpoint, 'recent');
    programId = programId ?? rpcProgramId;

    const programVersion = await getGovernanceProgramVersion(
      connection,
      programId,
    );

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

  async withRealm() {
    return new RealmBuilder(this).withRealm();
  }
}

export class RealmBuilder {
  bench: BenchBuilder;

  realmPk: PublicKey;
  realmAuthorityPk: PublicKey;
  communityMintPk: PublicKey;

  communityOwnerRecordPk: PublicKey;

  constructor(bench: BenchBuilder) {
    this.bench = bench;
  }

  async withRealm() {
    const name = `Realm-${new Keypair().publicKey.toBase58().slice(0, 6)}`;
    this.realmAuthorityPk = this.bench.walletPk;

    // Create and mint governance token
    this.communityMintPk = await withCreateMint(
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
    const councilMintPk = undefined;

    this.realmPk = await withCreateRealm(
      this.bench.instructions,
      this.bench.programId,
      this.bench.programVersion,
      name,
      this.realmAuthorityPk,
      this.communityMintPk,
      this.bench.walletPk,
      councilMintPk,
      communityMintMaxVoteWeightSource,
      new BN(1),
    );

    return this;
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
        maxVotingTime: getTimestampFromDays(3),
        voteTipping: VoteTipping.Strict,
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
      });

    const governedAccountPk = Keypair.generate().publicKey;

    const governancePk = await withCreateGovernance(
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

    return governancePk;
  }

  async getGovernance(governancePk: PublicKey) {
    return getGovernance(this.bench.connection, governancePk);
  }

  async sendTx() {
    await this.bench.sendTx();
    return this;
  }
}
