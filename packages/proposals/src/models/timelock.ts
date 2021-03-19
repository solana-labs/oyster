import * as Layout from '../utils/layout';
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { utils } from '@oyster/common';

export const DESC_SIZE = 200;
export const NAME_SIZE = 32;
export const CONFIG_NAME_LENGTH = 32;
export const INSTRUCTION_LIMIT = 450;
export const TRANSACTION_SLOTS = 4;
export const TEMP_FILE_TXN_SIZE = 1000;

export enum TimelockInstruction {
  InitTimelockSet = 1,
  AddSigner = 2,
  RemoveSigner = 3,
  AddCustomSingleSignerTransaction = 4,
  Sign = 8,
  Vote = 9,
  InitTimelockConfig = 10,
  Ping = 11,
  Execute = 12,
  DepositGovernanceTokens = 13,
  WithdrawVotingTokens = 14,
  CreateEmptyTimelockConfig = 15,
}

export interface TimelockConfig {
  ///version
  version: number;
  /// Consensus Algorithm
  consensusAlgorithm: ConsensusAlgorithm;
  /// Execution type
  executionType: ExecutionType;
  /// Timelock Type
  timelockType: TimelockType;
  /// Voting entry rule
  votingEntryRule: VotingEntryRule;
  /// Minimum slot time-distance from creation of proposal for an instruction to be placed
  minimumSlotWaitingPeriod: BN;
  /// Governance mint (optional)
  governanceMint: PublicKey;
  /// Program ID that is tied to this config (optional)
  program: PublicKey;
  /// Time limit in slots for proposal to be open to voting
  timeLimit: BN;
  /// Optional name
  name: string;
}

export const TimelockConfigLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    BufferLayout.u8('consensusAlgorithm'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('timelockType'),
    BufferLayout.u8('votingEntryRule'),
    Layout.uint64('minimumSlotWaitingPeriod'),
    Layout.publicKey('governanceMint'),
    Layout.publicKey('program'),
    Layout.uint64('timeLimit'),
    BufferLayout.seq(BufferLayout.u8(), CONFIG_NAME_LENGTH, 'name'),
  ],
);

export enum VotingEntryRule {
  DraftOnly = 0,
  Anytime = 1,
}

export enum ConsensusAlgorithm {
  Majority = 0,
  SuperMajority = 1,
  FullConsensus = 2,
}

export enum ExecutionType {
  AllOrNothing = 0,
  AnyAboveVoteFinishSlot = 1,
}

export enum TimelockType {
  CustomSingleSignerV1 = 0,
}

export enum TimelockStateStatus {
  /// Draft
  Draft = 0,
  /// Taking votes
  Voting = 1,

  /// Votes complete, in execution phase
  Executing = 2,

  /// Completed, can be rebooted
  Completed = 3,

  /// Deleted
  Deleted = 4,

  /// Defeated
  Defeated = 5,
}

export const STATE_COLOR: Record<string, string> = {
  [TimelockStateStatus.Draft]: 'orange',
  [TimelockStateStatus.Voting]: 'blue',
  [TimelockStateStatus.Executing]: 'green',
  [TimelockStateStatus.Completed]: 'purple',
  [TimelockStateStatus.Deleted]: 'gray',
  [TimelockStateStatus.Defeated]: 'red',
};

export interface TimelockState {
  status: TimelockStateStatus;
  totalSigningTokensMinted: BN;
  timelockTransactions: PublicKey[];
  name: string;
  descLink: string;
  votingEndedAt: BN;
  votingBeganAt: BN;
  executions: number;
  usedTxnSlots: number;
}

const timelockTxns = [];
for (let i = 0; i < TRANSACTION_SLOTS; i++) {
  timelockTxns.push(Layout.publicKey('timelockTxn' + i.toString()));
}

export const TimelockSetLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    Layout.publicKey('signatoryMint'),
    Layout.publicKey('adminMint'),
    Layout.publicKey('votingMint'),
    Layout.publicKey('yesVotingMint'),
    Layout.publicKey('noVotingMint'),
    Layout.publicKey('signatoryValidation'),
    Layout.publicKey('adminValidation'),
    Layout.publicKey('votingValidation'),
    Layout.publicKey('governanceHolding'),
    Layout.publicKey('yesVotingDump'),
    Layout.publicKey('noVotingDump'),
    Layout.publicKey('config'),
    BufferLayout.u8('timelockStateStatus'),
    Layout.uint64('totalSigningTokensMinted'),
    BufferLayout.seq(BufferLayout.u8(), DESC_SIZE, 'descLink'),
    BufferLayout.seq(BufferLayout.u8(), NAME_SIZE, 'name'),
    Layout.uint64('votingEndedAt'),
    Layout.uint64('votingBeganAt'),
    BufferLayout.u8('executions'),
    BufferLayout.u8('usedTxnSlots'),
    ...timelockTxns,
  ],
);

export interface TimelockSet {
  /// Version of the struct
  version: number;

  /// Mint that creates signatory tokens of this instruction
  /// If there are outstanding signatory tokens, then cannot leave draft state. Signatories must burn tokens (ie agree
  /// to move instruction to voting state) and bring mint to net 0 tokens outstanding. Each signatory gets 1 (serves as flag)
  signatoryMint: PublicKey;

  /// Admin ownership mint. One token is minted, can be used to grant admin status to a new person.
  adminMint: PublicKey;

  /// Mint that creates voting tokens of this instruction
  votingMint: PublicKey;

  /// Mint that creates evidence of voting YES via token creation
  yesVotingMint: PublicKey;

  /// Mint that creates evidence of voting NO via token creation
  noVotingMint: PublicKey;

  /// Used to validate signatory tokens in a round trip transfer
  signatoryValidation: PublicKey;

  /// Used to validate admin tokens in a round trip transfer
  adminValidation: PublicKey;

  /// Used to validate voting tokens in a round trip transfer
  votingValidation: PublicKey;

  /// Governance holding account
  governanceHolding: PublicKey;

  /// Yes Voting dump account for exchanged vote tokens
  yesVotingDump: PublicKey;

  /// No Voting dump account for exchanged vote tokens
  noVotingDump: PublicKey;

  /// configuration values
  config: PublicKey;

  /// Reserve state
  state: TimelockState;
}

export const CustomSingleSignerTimelockTransactionLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    Layout.uint64('slot'),
    BufferLayout.seq(BufferLayout.u8(), INSTRUCTION_LIMIT, 'instruction'),
    BufferLayout.u8('executed'),
    BufferLayout.u16('instructionEndIndex'),
  ],
);

export interface TimelockTransaction {
  version: number;

  slot: BN;

  instruction: number[];

  executed: number;

  instructionEndIndex: number;
}
export interface CustomSingleSignerTimelockTransaction
  extends TimelockTransaction {}

export const TimelockSetParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = TimelockSetLayout.decode(buffer);

  const timelockTxns = [];
  for (let i = 0; i < TRANSACTION_SLOTS; i++) {
    timelockTxns.push(data['timelockTxn' + i.toString()]);
  }

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      version: data.version,
      signatoryMint: data.signatoryMint,
      adminMint: data.adminMint,
      votingMint: data.votingMint,
      yesVotingMint: data.yesVotingMint,
      noVotingMint: data.noVotingMint,
      signatoryValidation: data.signatoryValidation,
      adminValidation: data.adminValidation,
      votingValidation: data.votingValidation,
      governanceHolding: data.governanceHolding,
      yesVotingDump: data.yesVotingDump,
      noVotingDump: data.noVotingDump,
      config: data.config,
      state: {
        status: data.timelockStateStatus,
        totalSigningTokensMinted: data.totalSigningTokensMinted,
        descLink: utils.fromUTF8Array(data.descLink).replaceAll('\u0000', ''),
        name: utils.fromUTF8Array(data.name).replaceAll('\u0000', ''),
        timelockTransactions: timelockTxns,
        votingEndedAt: data.votingEndedAt,
        votingBeganAt: data.votingBeganAt,
        executions: data.executions,
        usedTxnSlots: data.usedTxnSlots,
      },
    },
  };

  return details;
};

export const CustomSingleSignerTimelockTransactionParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = CustomSingleSignerTimelockTransactionLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      version: data.version,
      slot: data.slot,
      instruction: data.instruction.slice(0, data.instructionEndIndex + 1),

      executed: data.executed,
      instructionEndIndex: data.instructionEndIndex,
    },
  };

  return details;
};

export const TimelockConfigParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = TimelockConfigLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      version: data.version,
      consensusAlgorithm: data.consensusAlgorithm,
      executionType: data.executionType,
      timelockType: data.timelockType,
      votingEntryRule: data.votingEntryRule,
      minimumSlotWaitingPeriod: data.minimumSlotWaitingPeriod,
      governanceMint: data.governanceMint,
      program: data.program,
      timeLimit: data.timeLimit,
      name: utils.fromUTF8Array(data.name).replaceAll('\u0000', ''),
    },
  };

  return details;
};
