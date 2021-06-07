import * as Layout from '../utils/layout';
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js';
import {
  AccountInfo,
  PublicKey,
  TransactionInstruction,
  AccountMeta,
} from '@solana/web3.js';
import { deserializeBorsh, ParsedAccountBase, utils } from '@oyster/common';

import { BinaryReader, BinaryWriter } from 'borsh';
import {
  AddSignatoryArgs,
  CastVoteArgs,
  CreateAccountGovernanceArgs,
  CreateProgramGovernanceArgs,
  CreateProposalArgs,
  CreateRealmArgs,
  DepositGoverningTokensArgs,
  ExecuteInstructionArgs,
  InsertInstructionArgs,
  RelinquishVoteArgs,
  SignOffProposalArgs,
  WithdrawGoverningTokensArgs,
} from './instructions';
import {
  AccountMetaData,
  Governance,
  GovernanceAccountType,
  GovernanceConfig,
  InstructionData,
  Proposal,
  ProposalInstruction,
  ProposalState,
  Realm,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
  VoteWeight,
} from './accounts';
import { serialize } from 'borsh';

export const DESC_SIZE = 200;
export const NAME_SIZE = 32;
export const MAX_REALM_NAME_LENGTH = 32;
export const INSTRUCTION_LIMIT = 450;
export const MAX_TRANSACTIONS = 5;
export const TEMP_FILE_TXN_SIZE = 1000;

// Temp. workaround to support u16.
(BinaryReader.prototype as any).readU16 = function () {
  const reader = (this as unknown) as BinaryReader;
  const value = reader.buf.readUInt16LE(reader.offset);
  reader.offset += 2;
  return value;
};

// Temp. workaround to support u16.
(BinaryWriter.prototype as any).writeU16 = function (value: number) {
  const reader = (this as unknown) as BinaryWriter;
  reader.maybeResize();
  reader.buf.writeUInt16LE(value, reader.length);
  reader.length += 2;
};

(BinaryWriter.prototype as any).writeAccountMeta = function (
  value: AccountMeta,
) {
  const writer = (this as unknown) as BinaryWriter;
  writer.writeFixedArray(value.pubkey.toBuffer());
  writer.writeU8(value.isSigner ? 1 : 0);
  writer.writeU8(value.isWritable ? 1 : 0);
};

export const SOLANA_SDK_SCHEMA = new Map<any, any>([
  [
    TransactionInstruction,
    {
      kind: 'struct',
      fields: [
        ['programId', 'pubkey'],
        ['keys', ['AccountMeta']],
        ['data', ['u8']],
      ],
    },
  ],
]);

export const serializeInstruction = (instruction: TransactionInstruction) =>
  Buffer.from(serialize(SOLANA_SDK_SCHEMA, instruction)).toString('base64');

export const GOVERNANCE_SCHEMA = new Map<any, any>([
  [
    CreateRealmArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['name', 'string'],
      ],
    },
  ],
  [
    DepositGoverningTokensArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    WithdrawGoverningTokensArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    CreateAccountGovernanceArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['config', GovernanceConfig],
      ],
    },
  ],
  [
    CreateProgramGovernanceArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['config', GovernanceConfig],
        ['transferUpgradeAuthority', 'u8'],
      ],
    },
  ],
  [
    CreateProposalArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['name', 'string'],
        ['descriptionLink', 'string'],
        ['governingTokenMint', 'pubkey'],
      ],
    },
  ],
  [
    AddSignatoryArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['signatory', 'pubkey'],
      ],
    },
  ],
  [
    SignOffProposalArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RelinquishVoteArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    CastVoteArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['vote', 'u8'],
      ],
    },
  ],
  [
    InsertInstructionArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['index', 'u16'],
        ['holdUpTime', 'u64'],
        ['instructionData', InstructionData],
      ],
    },
  ],
  [
    ExecuteInstructionArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    InstructionData,
    {
      kind: 'struct',
      fields: [
        ['programId', 'pubkey'],
        ['accounts', [AccountMetaData]],
        ['data', ['u8']],
      ],
    },
  ],
  [
    AccountMetaData,
    {
      kind: 'struct',
      fields: [
        ['pubkey', 'pubkey'],
        ['isSigner', 'u8'],
        ['isWritable', 'u8'],
      ],
    },
  ],
  [
    Realm,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['communityMint', 'pubkey'],
        ['councilMint', { kind: 'option', type: 'pubkey' }],
        ['name', 'string'],
      ],
    },
  ],
  [
    Governance,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['config', GovernanceConfig],
        ['proposalCount', 'u32'],
      ],
    },
  ],
  [
    GovernanceConfig,
    {
      kind: 'struct',
      fields: [
        ['realm', 'pubkey'],
        ['governedAccount', 'pubkey'],
        ['yesVoteThresholdPercentage', 'u8'],
        ['minTokensToCreateProposal', 'u16'],
        ['minInstructionHoldUpTime', 'u64'],
        ['maxVotingTime', 'u64'],
      ],
    },
  ],
  [
    TokenOwnerRecord,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['realm', 'pubkey'],
        ['governingTokenMint', 'pubkey'],
        ['governingTokenOwner', 'pubkey'],
        ['governingTokenDepositAmount', 'u64'],
        ['governanceDelegate', { kind: 'option', type: 'pubkey' }],
        ['unrelinquishedVotesCount', 'u32'],
        ['totalVotesCount', 'u32'],
      ],
    },
  ],
  [
    Proposal,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['governance', 'pubkey'],
        ['governingTokenMint', 'pubkey'],
        ['state', 'u8'],
        ['tokenOwnerRecord', 'pubkey'],
        ['signatoriesCount', 'u8'],
        ['signatoriesSignedOffCount', 'u8'],
        ['descriptionLink', 'string'],
        ['name', 'string'],
        ['yesVotesCount', 'u64'],
        ['noVotesCount', 'u64'],
        ['draftAt', 'u64'],
        ['signingOffAt', { kind: 'option', type: 'u64' }],
        ['votingAt', { kind: 'option', type: 'u64' }],
        ['votingCompletedAt', { kind: 'option', type: 'u64' }],
        ['executingAt', { kind: 'option', type: 'u64' }],
        ['closedAt', { kind: 'option', type: 'u64' }],
        ['instructionsExecutedCount', 'u16'],
        ['instructionsCount', 'u16'],
        ['instructionsNextIndex', 'u16'],
      ],
    },
  ],
  [
    SignatoryRecord,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['proposal', 'pubkey'],
        ['signatory', 'pubkey'],
        ['signedOff', 'u8'],
      ],
    },
  ],
  [
    VoteWeight,
    {
      kind: 'enum',
      values: [
        ['yes', 'u64'],
        ['no', 'u64'],
      ],
    },
  ],
  [
    VoteRecord,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['proposal', 'pubkey'],
        ['governingTokenOwner', 'pubkey'],
        ['isRelinquished', 'u8'],
        ['voteWeight', VoteWeight],
      ],
    },
  ],
  [
    ProposalInstruction,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['proposal', 'pubkey'],
        ['holdUpTime', 'u64'],
        ['instruction', InstructionData],
        ['executedAt', { kind: 'option', type: 'u64' }],
      ],
    },
  ],
]);

export function BorshAccountParser(
  classType: any,
): (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase {
  return (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
    const buffer = Buffer.from(info.data);
    const data = deserializeBorsh(GOVERNANCE_SCHEMA, classType, buffer);

    return {
      pubkey: pubKey,
      account: {
        ...info,
      },
      info: data,
    } as ParsedAccountBase;
  };
}

// ----------------- Old structures

export interface GovernanceVotingRecord {
  /// Account type
  accountType: GovernanceAccountType;
  /// proposal
  proposal: PublicKey;
  /// owner
  owner: PublicKey;

  /// How many votes were unspent
  undecidedCount: BN;
  /// How many votes were spent yes
  yesCount: BN;
  /// How many votes were spent no
  noCount: BN;
}

export const GovernanceVotingRecordLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('accountType'),
    Layout.publicKey('proposal'),
    Layout.publicKey('owner'),
    Layout.uint64('undecidedCount'),
    Layout.uint64('yesCount'),
    Layout.uint64('noCount'),
    BufferLayout.seq(BufferLayout.u8(), 100, 'padding'),
  ],
);

export interface GovernanceOld {
  /// Account type
  accountType: GovernanceAccountType;
  /// Vote threshold
  voteThreshold: number;

  /// Minimum slot time-distance from creation of proposal for an instruction to be placed
  minimumSlotWaitingPeriod: BN;
  /// Governance mint
  governanceMint: PublicKey;
  /// Council mint (Optional)
  councilMint?: PublicKey;
  /// Program ID that is tied to this config (optional)
  program: PublicKey;
  /// Time limit in slots for proposal to be open to voting
  timeLimit: BN;
  /// Optional name
  name: string;
  /// Running count of proposals
  count: number;
}

export const GovernanceLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('accountType'),
    BufferLayout.u8('voteThreshold'),
    Layout.uint64('minimumSlotWaitingPeriod'),
    Layout.publicKey('governanceMint'),
    BufferLayout.u8('councilMintOption'),
    Layout.publicKey('councilMint'),
    Layout.publicKey('program'),
    Layout.uint64('timeLimit'),
    BufferLayout.seq(BufferLayout.u8(), MAX_REALM_NAME_LENGTH, 'name'),
    BufferLayout.u32('count'),
    BufferLayout.seq(BufferLayout.u8(), 295, 'padding'),
  ],
);

export enum ProposalStateStatus {
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
  [ProposalState.Draft]: 'orange',
  [ProposalState.Voting]: 'blue',
  [ProposalState.Executing]: 'green',
  [ProposalState.Completed]: 'purple',
  [ProposalState.Cancelled]: 'gray',
  [ProposalState.Defeated]: 'red',
};

export interface ProposalStateOld {
  /// Account type
  accountType: GovernanceAccountType;
  proposal: PublicKey;
  status: ProposalStateStatus;
  totalSigningTokensMinted: BN;
  proposalTransactions: PublicKey[];
  name: string;
  descLink: string;
  votingEndedAt: BN;
  votingBeganAt: BN;
  createdAt: BN;
  completedAt: BN;
  deletedAt: BN;
  executions: number;
  usedTxnSlots: number;
}

const proposalTxns = [];
for (let i = 0; i < MAX_TRANSACTIONS; i++) {
  proposalTxns.push(Layout.publicKey('proposalTxn' + i.toString()));
}

export const ProposalLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('accountType'),
    Layout.publicKey('config'),
    Layout.publicKey('state'),
    Layout.publicKey('signatoryMint'),
    Layout.publicKey('adminMint'),
    Layout.publicKey('votingMint'),
    Layout.publicKey('yesVotingMint'),
    Layout.publicKey('noVotingMint'),
    Layout.publicKey('sourceMint'),
    Layout.publicKey('signatoryValidation'),
    Layout.publicKey('adminValidation'),
    Layout.publicKey('votingValidation'),
    Layout.publicKey('sourceHolding'),

    BufferLayout.seq(BufferLayout.u8(), 300, 'padding'),
  ],
);

export const ProposalStateLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('accountType'),
    Layout.publicKey('proposal'),
    BufferLayout.u8('proposalStateStatus'),
    Layout.uint64('totalSigningTokensMinted'),
    BufferLayout.seq(BufferLayout.u8(), DESC_SIZE, 'descLink'),
    BufferLayout.seq(BufferLayout.u8(), NAME_SIZE, 'name'),
    Layout.uint64('votingEndedAt'),
    Layout.uint64('votingBeganAt'),
    Layout.uint64('createdAt'),
    Layout.uint64('completedAt'),
    Layout.uint64('deletedAt'),
    BufferLayout.u8('executions'),
    BufferLayout.u8('usedTxnSlots'),
    ...proposalTxns,
    BufferLayout.seq(BufferLayout.u8(), 300, 'padding'),
  ],
);

export interface ProposalOld {
  /// Account type
  accountType: GovernanceAccountType;

  /// configuration values
  config: PublicKey;

  /// state values
  state: PublicKey;

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

  /// Source mint - either governance or council mint from config
  sourceMint: PublicKey;

  /// Used to validate signatory tokens in a round trip transfer
  signatoryValidation: PublicKey;

  /// Used to validate admin tokens in a round trip transfer
  adminValidation: PublicKey;

  /// Used to validate voting tokens in a round trip transfer
  votingValidation: PublicKey;

  /// Governance holding account
  sourceHolding: PublicKey;
}

export const CustomSingleSignerTransactionLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('accountType'),
    Layout.uint64('slot'),
    BufferLayout.seq(BufferLayout.u8(), INSTRUCTION_LIMIT, 'instruction'),
    BufferLayout.u8('executed'),
    BufferLayout.u16('instructionEndIndex'),
    BufferLayout.seq(BufferLayout.u8(), 300, 'padding'),
  ],
);

export interface GovernanceTransaction {
  /// Account type
  accountType: GovernanceAccountType;

  slot: BN;

  instruction: number[];

  executed: number;

  instructionEndIndex: number;
}
export interface CustomSingleSignerTransaction extends GovernanceTransaction {}

export const ProposalOldParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = ProposalLayout.decode(buffer);
  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      accountType: data.accountType,
      config: data.config,
      state: data.state,
      signatoryMint: data.signatoryMint,
      adminMint: data.adminMint,
      votingMint: data.votingMint,
      yesVotingMint: data.yesVotingMint,
      noVotingMint: data.noVotingMint,
      sourceMint: data.sourceMint,
      signatoryValidation: data.signatoryValidation,
      adminValidation: data.adminValidation,
      votingValidation: data.votingValidation,
      sourceHolding: data.sourceHolding,
    },
  };

  return details;
};

export const GovernanceVotingRecordParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const data = GovernanceVotingRecordLayout.decode(info.data);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      accountType: data.accountType,
      proposal: data.proposal,
      owner: data.owner,
      undecidedCount: data.undecidedCount,
      yesCount: data.yesCount,
      noCount: data.noCount,
    },
  };

  return details;
};

export const ProposalStateParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = ProposalStateLayout.decode(buffer);

  const proposalTxns = [];
  for (let i = 0; i < MAX_TRANSACTIONS; i++) {
    proposalTxns.push(data['proposalTxn' + i.toString()]);
  }

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      accountType: data.accountType,
      proposal: data.proposal,
      status: data.proposalStateStatus,
      totalSigningTokensMinted: data.totalSigningTokensMinted,
      descLink: utils.fromUTF8Array(data.descLink).replaceAll('\u0000', ''),
      name: utils.fromUTF8Array(data.name).replaceAll('\u0000', ''),
      proposalTransactions: proposalTxns,
      votingEndedAt: data.votingEndedAt,
      votingBeganAt: data.votingBeganAt,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
      deletedAt: data.deletedAt,
      executions: data.executions,
      usedTxnSlots: data.usedTxnSlots,
    },
  };

  return details;
};

export const CustomSingleSignerTransactionParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = CustomSingleSignerTransactionLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      accountType: data.accountType,
      slot: data.slot,
      instruction: data.instruction.slice(0, data.instructionEndIndex + 1),

      executed: data.executed,
      instructionEndIndex: data.instructionEndIndex,
    },
  };

  return details;
};

export const GovernanceOldParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const data = GovernanceLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: {
      accountType: data.accountType,
      voteThreshold: data.voteThreshold,

      minimumSlotWaitingPeriod: data.minimumSlotWaitingPeriod,
      governanceMint: data.governanceMint,
      councilMint: data.councilMintOption === 1 ? data.councilMint : null,
      program: data.program,
      timeLimit: data.timeLimit,
      name: utils.fromUTF8Array(data.name).replaceAll('\u0000', ''),
      count: data.count,
    },
  };

  return details;
};
