import { TransactionInstruction } from '@solana/web3.js';

import { BinaryReader, BinaryWriter } from 'borsh';
import {
  AddSignatoryArgs,
  CancelProposalArgs,
  CastVoteArgs,
  CreateGovernanceArgs,
  CreateMintGovernanceArgs,
  CreateNativeTreasuryArgs,
  CreateProgramGovernanceArgs,
  CreateProposalArgs,
  CreateRealmArgs,
  CreateTokenGovernanceArgs,
  CreateTokenOwnerRecordArgs,
  DepositGoverningTokensArgs,
  ExecuteTransactionArgs,
  FinalizeVoteArgs,
  FlagTransactionErrorArgs,
  InsertTransactionArgs,
  RelinquishVoteArgs,
  RemoveTransactionArgs,
  SetGovernanceConfigArgs,
  SetGovernanceDelegateArgs,
  SetRealmAuthorityArgs,
  SetRealmConfigArgs,
  SignOffProposalArgs,
  UpdateProgramMetadataArgs,
  Vote,
  VoteChoice,
  VoteKind,
  WithdrawGoverningTokensArgs,
} from './instructions';
import {
  AccountMetaData,
  RealmConfigArgs,
  Governance,
  GovernanceConfig,
  InstructionData,
  MintMaxVoteWeightSource,
  Proposal,
  ProposalTransaction,
  Realm,
  RealmConfig,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
  VoteThresholdPercentage,
  VoteWeight,
  RealmConfigAccount,
  GovernanceAccountClass,
  VoteType,
  VoteTypeKind,
  ProposalOption,
  GovernanceAccountType,
  getAccountProgramVersion,
  ProgramMetadata,
} from './accounts';
import { serialize } from 'borsh';
import { BorshAccountParser } from '../core/serialisation';
import { PROGRAM_VERSION_V1 } from '../registry/constants';
import { deserializeBorsh } from '../tools/borsh';

// ------------ u16 ------------

// Temp. workaround to support u16.
(BinaryReader.prototype as any).readU16 = function () {
  const reader = (this as unknown) as BinaryReader;
  const value = reader.buf.readUInt16LE(reader.offset);
  reader.offset += 2;
  return value;
};

// Temp. workaround to support u16.
(BinaryWriter.prototype as any).writeU16 = function (value: number) {
  const writer = (this as unknown) as BinaryWriter;
  writer.maybeResize();
  writer.buf.writeUInt16LE(value, writer.length);
  writer.length += 2;
};

// ------------ VoteType ------------

(BinaryReader.prototype as any).readVoteType = function () {
  const reader = (this as unknown) as BinaryReader;
  const value = reader.buf.readUInt8(reader.offset);
  reader.offset += 1;

  if (value === VoteTypeKind.SingleChoice) {
    return VoteType.SINGLE_CHOICE;
  }

  const choiceCount = reader.buf.readUInt16LE(reader.offset);
  return VoteType.MULTI_CHOICE(choiceCount);
};

(BinaryWriter.prototype as any).writeVoteType = function (value: VoteType) {
  const writer = (this as unknown) as BinaryWriter;
  writer.maybeResize();
  writer.buf.writeUInt8(value.type, writer.length);
  writer.length += 1;

  if (value.type === VoteTypeKind.MultiChoice) {
    writer.buf.writeUInt16LE(value.choiceCount!, writer.length);
    writer.length += 2;
  }
};

// ------------ Vote ------------

(BinaryReader.prototype as any).readVote = function () {
  const reader = (this as unknown) as BinaryReader;
  const value = reader.buf.readUInt8(reader.offset);
  reader.offset += 1;

  if (value === VoteKind.Deny) {
    return new Vote({ voteType: value, approveChoices: undefined, deny: true });
  }

  let approveChoices: VoteChoice[] = [];

  reader.readArray(() => {
    const rank = reader.buf.readUInt8(reader.offset);
    reader.offset += 1;
    const weightPercentage = reader.buf.readUInt8(reader.offset);
    reader.offset += 1;

    approveChoices.push(
      new VoteChoice({ rank: rank, weightPercentage: weightPercentage }),
    );
  });

  return new Vote({
    voteType: value,
    approveChoices: approveChoices,
    deny: undefined,
  });
};

(BinaryWriter.prototype as any).writeVote = function (value: Vote) {
  const writer = (this as unknown) as BinaryWriter;
  writer.maybeResize();
  writer.buf.writeUInt8(value.voteType, writer.length);
  writer.length += 1;

  if (value.voteType === VoteKind.Approve) {
    writer.writeArray(value.approveChoices as any[], (item: VoteChoice) => {
      writer.buf.writeUInt8(item.rank, writer.length);
      writer.length += 1;
      writer.buf.writeUInt8(item.weightPercentage, writer.length);
      writer.length += 1;
    });
  }
};

// Serializes sdk instruction into InstructionData and encodes it as base64 which then can be entered into the UI form
export const serializeInstructionToBase64 = (
  instruction: TransactionInstruction,
) => {
  let data = createInstructionData(instruction);

  return Buffer.from(serialize(GOVERNANCE_SCHEMA, data)).toString('base64');
};

// Converts TransactionInstruction to InstructionData format
export const createInstructionData = (instruction: TransactionInstruction) => {
  return new InstructionData({
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
};

export const GOVERNANCE_SCHEMA_V1 = createGovernanceSchema(1);
export const GOVERNANCE_SCHEMA = createGovernanceSchema(2);

export function getGovernanceSchema(programVersion: number) {
  switch (programVersion) {
    case 1:
      return GOVERNANCE_SCHEMA_V1;
    default:
      return GOVERNANCE_SCHEMA;
  }
}

function createGovernanceSchema(programVersion: number) {
  return new Map<Function, any>([
    [
      RealmConfigArgs,
      {
        kind: 'struct',
        fields: [
          ['useCouncilMint', 'u8'],
          ['minCommunityTokensToCreateGovernance', 'u64'],
          ['communityMintMaxVoteWeightSource', MintMaxVoteWeightSource],
          // V1 of the program used restrictive instruction deserialisation which didn't allow additional data
          ...(programVersion > PROGRAM_VERSION_V1
            ? [
                ['useCommunityVoterWeightAddin', 'u8'],
                ['useMaxCommunityVoterWeightAddin', 'u8'],
              ]
            : []),
        ],
      },
    ],
    [
      CreateRealmArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['name', 'string'],
          ['configArgs', RealmConfigArgs],
        ],
      },
    ],
    [
      DepositGoverningTokensArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          // V1 of the program used restrictive instruction deserialisation which didn't allow additional data
          programVersion > PROGRAM_VERSION_V1 ? ['amount', 'u64'] : undefined,
        ].filter(Boolean),
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
      SetGovernanceDelegateArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['newGovernanceDelegate', { kind: 'option', type: 'pubkey' }],
        ],
      },
    ],
    [
      CreateGovernanceArgs,
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
          ['transferMintAuthorities', 'u8'],
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

          ...(programVersion === PROGRAM_VERSION_V1
            ? [['governingTokenMint', 'pubkey']]
            : [
                ['voteType', 'voteType'],
                ['options', ['string']],
                ['useDenyOption', 'u8'],
              ]),
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
      VoteChoice,
      {
        kind: 'struct',
        fields: [
          ['rank', 'u8'],
          ['weightPercentage', 'u8'],
        ],
      },
    ],
    [
      CastVoteArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          programVersion === PROGRAM_VERSION_V1
            ? ['yesNoVote', 'u8']
            : ['vote', 'vote'],
        ],
      },
    ],
    [
      InsertTransactionArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          programVersion > PROGRAM_VERSION_V1
            ? ['optionIndex', 'u8']
            : undefined,
          ['index', 'u16'],
          ['holdUpTime', 'u32'],

          programVersion > PROGRAM_VERSION_V1
            ? ['instructions', [InstructionData]]
            : ['instructionData', InstructionData],
        ].filter(Boolean),
      },
    ],
    [
      RemoveTransactionArgs,
      {
        kind: 'struct',
        fields: [['instruction', 'u8']],
      },
    ],
    [
      ExecuteTransactionArgs,
      {
        kind: 'struct',
        fields: [['instruction', 'u8']],
      },
    ],
    [
      FlagTransactionErrorArgs,
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
          ...(programVersion === PROGRAM_VERSION_V1
            ? [['newRealmAuthority', { kind: 'option', type: 'pubkey' }]]
            : [['action', 'u8']]),
        ],
      },
    ],
    [
      SetRealmConfigArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['configArgs', RealmConfigArgs],
        ],
      },
    ],
    [
      CreateTokenOwnerRecordArgs,
      {
        kind: 'struct',
        fields: [['instruction', 'u8']],
      },
    ],
    [
      UpdateProgramMetadataArgs,
      {
        kind: 'struct',
        fields: [['instruction', 'u8']],
      },
    ],
    [
      CreateNativeTreasuryArgs,
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
      MintMaxVoteWeightSource,
      {
        kind: 'struct',
        fields: [
          ['type', 'u8'],
          ['value', 'u64'],
        ],
      },
    ],

    [
      RealmConfig,
      {
        kind: 'struct',
        fields: [
          ['useCommunityVoterWeightAddin', 'u8'],
          ['useMaxCommunityVoterWeightAddin', 'u8'],
          ['reserved', [6]],
          ['minCommunityTokensToCreateGovernance', 'u64'],
          ['communityMintMaxVoteWeightSource', MintMaxVoteWeightSource],
          ['councilMint', { kind: 'option', type: 'pubkey' }],
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
          ['config', RealmConfig],
          ['reserved', [6]],
          ['votingProposalCount', 'u16'],
          ['authority', { kind: 'option', type: 'pubkey' }],
          ['name', 'string'],
        ],
      },
    ],
    [
      RealmConfigAccount,
      {
        kind: 'struct',
        fields: [
          ['accountType', 'u8'],
          ['realm', 'pubkey'],
          ['communityVoterWeightAddin', { kind: 'option', type: 'pubkey' }],
          ['maxCommunityVoterWeightAddin', { kind: 'option', type: 'pubkey' }],
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
          ['reserved', [6]],
          ['votingProposalCount', 'u16'],
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
          ['voteTipping', 'u8'],
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
          ['outstandingProposalCount', 'u8'],
          ['reserved', [7]],
          ['governanceDelegate', { kind: 'option', type: 'pubkey' }],
        ],
      },
    ],
    [
      ProposalOption,
      {
        kind: 'struct',
        fields: [
          ['label', 'string'],
          ['voteWeight', 'u64'],
          ['voteResult', 'u8'],
          ['instructionsExecutedCount', 'u16'],
          ['instructionsCount', 'u16'],
          ['instructionsNextIndex', 'u16'],
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

          ...(programVersion === PROGRAM_VERSION_V1
            ? [
                ['yesVotesCount', 'u64'],
                ['noVotesCount', 'u64'],
                ['instructionsExecutedCount', 'u16'],
                ['instructionsCount', 'u16'],
                ['instructionsNextIndex', 'u16'],
              ]
            : [
                ['voteType', 'voteType'],
                ['options', [ProposalOption]],
                ['denyVoteWeight', { kind: 'option', type: 'u64' }],
                ['vetoVoteWeight', { kind: 'option', type: 'u64' }],
                ['abstainVoteWeight', { kind: 'option', type: 'u64' }],
                ['startVotingAt', { kind: 'option', type: 'u64' }],
              ]),

          ['draftAt', 'u64'],
          ['signingOffAt', { kind: 'option', type: 'u64' }],
          ['votingAt', { kind: 'option', type: 'u64' }],
          ['votingAtSlot', { kind: 'option', type: 'u64' }],
          ['votingCompletedAt', { kind: 'option', type: 'u64' }],
          ['executingAt', { kind: 'option', type: 'u64' }],
          ['closedAt', { kind: 'option', type: 'u64' }],
          ['executionFlags', 'u8'],
          ['maxVoteWeight', { kind: 'option', type: 'u64' }],

          ...(programVersion === PROGRAM_VERSION_V1
            ? []
            : [['maxVotingTime', { kind: 'option', type: 'u32' }]]),

          [
            'voteThresholdPercentage',
            { kind: 'option', type: VoteThresholdPercentage },
          ],

          ...(programVersion === PROGRAM_VERSION_V1
            ? []
            : [['reserved', [64]]]),

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

          ...(programVersion === PROGRAM_VERSION_V1
            ? [['voteWeight', VoteWeight]]
            : [
                ['voterWeight', 'u64'],
                ['vote', 'vote'],
              ]),
        ],
      },
    ],
    [
      ProposalTransaction,
      {
        kind: 'struct',
        fields: [
          ['accountType', 'u8'],
          ['proposal', 'pubkey'],
          programVersion > PROGRAM_VERSION_V1
            ? ['optionIndex', 'u8']
            : undefined,
          ['instructionIndex', 'u16'],
          ['holdUpTime', 'u32'],
          programVersion > PROGRAM_VERSION_V1
            ? ['instructions', [InstructionData]]
            : ['instruction', InstructionData],
          ['executedAt', { kind: 'option', type: 'u64' }],
          ['executionStatus', 'u8'],
        ].filter(Boolean),
      },
    ],
    [
      ProgramMetadata,
      {
        kind: 'struct',
        fields: [
          ['accountType', 'u8'],
          ['updatedAt', 'u64'],
          ['version', 'string'],
          ['reserved', [64]],
        ],
      },
    ],
  ]);
}

export function getGovernanceSchemaForAccount(
  accountType: GovernanceAccountType,
) {
  return getGovernanceSchema(getAccountProgramVersion(accountType));
}

export const GovernanceAccountParser = (classType: GovernanceAccountClass) =>
  BorshAccountParser(classType, (accountType: GovernanceAccountType) =>
    getGovernanceSchemaForAccount(accountType),
  );

export function getInstructionDataFromBase64(instructionDataBase64: string) {
  const instructionDataBin = Buffer.from(instructionDataBase64, 'base64');
  const instructionData: InstructionData = deserializeBorsh(
    GOVERNANCE_SCHEMA,
    InstructionData,
    instructionDataBin,
  );

  return instructionData;
}

export class CreateVotePercentage {
  vote_percentage: number;

  constructor(args: { vote_percentage: number }) {
    this.vote_percentage = args.vote_percentage;
  }
}

export const VOTE_PERCENTAGE_SCHEMA = new Map([
  [
    CreateVotePercentage,
    {
      kind: 'struct',
      fields: [['vote_percentage', 'u16']],
    },
  ],
]);
