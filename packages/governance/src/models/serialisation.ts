import {
  AccountInfo,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { deserializeBorsh, ParsedAccountBase } from '@oyster/common';

import { BinaryReader, BinaryWriter } from 'borsh';
import {
  AddSignatoryArgs,
  CancelProposalArgs,
  CastVoteArgs,
  CreateAccountGovernanceArgs,
  CreateMintGovernanceArgs,
  CreateProgramGovernanceArgs,
  CreateProposalArgs,
  CreateRealmArgs,
  CreateTokenGovernanceArgs,
  DepositGoverningTokensArgs,
  ExecuteInstructionArgs,
  FinalizeVoteArgs,
  FlagInstructionErrorArgs,
  InsertInstructionArgs,
  RelinquishVoteArgs,
  RemoveInstructionArgs,
  SetGovernanceConfigArgs,
  SetRealmAuthorityArgs,
  SignOffProposalArgs,
  WithdrawGoverningTokensArgs,
} from './instructions';
import {
  AccountMetaData,
  Governance,
  GovernanceConfig,
  InstructionData,
  Proposal,
  ProposalInstruction,
  Realm,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
  VoteThresholdPercentage,
  VoteWeight,
} from './accounts';
import { serialize } from 'borsh';

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

// Serializes sdk instruction into InstructionData and encodes it as base64 which then can be entered into the UI form
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
    CreateMintGovernanceArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['config', GovernanceConfig],
        ['transferMintAuthority', 'u8'],
      ],
    },
  ],
  [
    CreateTokenGovernanceArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['config', GovernanceConfig],
        ['transferTokenOwner', 'u8'],
      ],
    },
  ],
  [
    SetGovernanceConfigArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['config', GovernanceConfig],
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
    CancelProposalArgs,
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
    FinalizeVoteArgs,
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
        ['holdUpTime', 'u32'],
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
    FlagInstructionErrorArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    SetRealmAuthorityArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['newRealmAuthority', { kind: 'option', type: 'pubkey' }],
      ],
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
        ['reserved', [8]],
        ['councilMint', { kind: 'option', type: 'pubkey' }],
        ['authority', { kind: 'option', type: 'pubkey' }],
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
        ['realm', 'pubkey'],
        ['governedAccount', 'pubkey'],
        ['proposalCount', 'u32'],
        ['config', GovernanceConfig],
        ['reserved', [8]],
      ],
    },
  ],
  [
    VoteThresholdPercentage,
    {
      kind: 'struct',
      fields: [
        ['type', 'u8'],
        ['value', 'u8'],
      ],
    },
  ],
  [
    GovernanceConfig,
    {
      kind: 'struct',
      fields: [
        ['voteThresholdPercentage', VoteThresholdPercentage],
        ['minCommunityTokensToCreateProposal', 'u64'],
        ['minInstructionHoldUpTime', 'u32'],
        ['maxVotingTime', 'u32'],
        ['voteWeightSource', 'u8'],
        ['proposalCoolOffTime', 'u32'],
        ['minCouncilTokensToCreateProposal', 'u64'],
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
        ['unrelinquishedVotesCount', 'u32'],
        ['totalVotesCount', 'u32'],
        ['reserved', [8]],
        ['governanceDelegate', { kind: 'option', type: 'pubkey' }],
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
        ['yesVotesCount', 'u64'],
        ['noVotesCount', 'u64'],
        ['instructionsExecutedCount', 'u16'],
        ['instructionsCount', 'u16'],
        ['instructionsNextIndex', 'u16'],
        ['draftAt', 'u64'],
        ['signingOffAt', { kind: 'option', type: 'u64' }],
        ['votingAt', { kind: 'option', type: 'u64' }],
        ['votingAtSlot', { kind: 'option', type: 'u64' }],
        ['votingCompletedAt', { kind: 'option', type: 'u64' }],
        ['executingAt', { kind: 'option', type: 'u64' }],
        ['closedAt', { kind: 'option', type: 'u64' }],
        ['executionFlags', 'u8'],
        ['governingTokenMintVoteSupply', { kind: 'option', type: 'u64' }],
        ['name', 'string'],
        ['descriptionLink', 'string'],
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
        ['instructionIndex', 'u16'],
        ['holdUpTime', 'u32'],
        ['instruction', InstructionData],
        ['executedAt', { kind: 'option', type: 'u64' }],
        ['executionStatus', 'u8'],
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

export function getInstructionDataFromBase64(instructionDataBase64: string) {
  const instructionDataBin = Buffer.from(instructionDataBase64, 'base64');
  const instructionData: InstructionData = deserializeBorsh(
    GOVERNANCE_SCHEMA,
    InstructionData,
    instructionDataBin,
  );

  return instructionData;
}
