import * as Layout from '../utils/layout';
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js';
import {
  AccountInfo,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { deserializeBorsh, ParsedAccountBase } from '@oyster/common';

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
  RemoveInstructionArgs,
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

export const serializeInstructionToBase64 = (
  instruction: TransactionInstruction,
) => {
  let data = new InstructionData({
    programId: instruction.programId,
    data: instruction.data,
    accounts: instruction.keys.map(
      k =>
        new AccountMetaData({
          pubkey: k.pubkey,
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        }),
    ),
  });

  return Buffer.from(serialize(GOVERNANCE_SCHEMA, data)).toString('base64');
};

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
    RemoveInstructionArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
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
  [ProposalState.SigningOff]: 'orange',
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
