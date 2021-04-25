import * as Layout from '../utils/layout';
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { utils } from '@oyster/common';

export const DESC_SIZE = 200;
export const NAME_SIZE = 32;
export const CONFIG_NAME_LENGTH = 32;
export const INSTRUCTION_LIMIT = 450;
export const MAX_TRANSACTIONS = 5;
export const TEMP_FILE_TXN_SIZE = 1000;

/// Seed for proposal authority
export const GOVERNANCE_AUTHORITY_SEED = 'governance';

export enum GovernanceInstruction {
  InitProposal = 1,
  AddSigner = 2,
  RemoveSigner = 3,
  AddCustomSingleSignerTransaction = 4,
  Sign = 8,
  Vote = 9,
  InitGovernance = 10,

  Execute = 11,
  DepositGovernanceTokens = 12,
  WithdrawVotingTokens = 13,
  CreateEmptyGovernance = 14,
  CreateGovernanceVotingRecord = 15,
}

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

export interface Governance {
  /// Account type
  accountType: GovernanceAccountType;
  /// Vote threshold
  voteThreshold: number;
  /// Execution type
  executionType: ExecutionType;
  /// Governance Type
  governanceType: GovernanceType;
  /// Voting entry rule
  votingEntryRule: VotingEntryRule;
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

export enum GovernanceAccountType {
  Uninitialized = 0,
  Governance = 1,
  Proposal = 2,
  ProposalState = 3,
  VoteRecord = 4,
  CustomSingleSignerTransaction = 5,
}

export const GovernanceLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('accountType'),
    BufferLayout.u8('voteThreshold'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('governanceType'),
    BufferLayout.u8('votingEntryRule'),
    Layout.uint64('minimumSlotWaitingPeriod'),
    Layout.publicKey('governanceMint'),
    BufferLayout.u8('councilMintOption'),
    Layout.publicKey('councilMint'),
    Layout.publicKey('program'),
    Layout.uint64('timeLimit'),
    BufferLayout.seq(BufferLayout.u8(), CONFIG_NAME_LENGTH, 'name'),
    BufferLayout.u32('count'),
    BufferLayout.seq(BufferLayout.u8(), 295, 'padding'),
  ],
);

export enum VotingEntryRule {
  Anytime = 0,
}

export enum ExecutionType {
  Independent = 0,
}

export enum GovernanceType {
  Governance = 0,
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
  [ProposalStateStatus.Draft]: 'orange',
  [ProposalStateStatus.Voting]: 'blue',
  [ProposalStateStatus.Executing]: 'green',
  [ProposalStateStatus.Completed]: 'purple',
  [ProposalStateStatus.Deleted]: 'gray',
  [ProposalStateStatus.Defeated]: 'red',
};

export interface ProposalState {
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
    Layout.publicKey('tokenProgramId'),
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
    Layout.publicKey('yesVotingDump'),
    Layout.publicKey('noVotingDump'),
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

export interface Proposal {
  /// Account type
  accountType: GovernanceAccountType;

  /// configuration values
  config: PublicKey;

  /// Token Program ID
  tokenProgramId: PublicKey;

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

  /// Yes Voting dump account for exchanged vote tokens
  yesVotingDump: PublicKey;

  /// No Voting dump account for exchanged vote tokens
  noVotingDump: PublicKey;
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

export const ProposalParser = (
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
      tokenProgramId: data.tokenProgramId,
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
      yesVotingDump: data.yesVotingDump,
      noVotingDump: data.noVotingDump,
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

export const GovernanceParser = (
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
      executionType: data.executionType,
      governanceType: data.governanceType,
      votingEntryRule: data.votingEntryRule,
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
