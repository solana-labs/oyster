import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

/// Seed  prefix for Governance Program PDAs
export const GOVERNANCE_PROGRAM_SEED = 'governance';

export enum GovernanceAccountType {
  Uninitialized = 0,
  Realm = 1,
  TokenOwnerRecord = 2,
  AccountGovernance = 3,
  ProgramGovernance = 4,
  Proposal = 5,
  SignatoryRecord = 6,
  VoteRecord = 7,
  ProposalInstruction = 8,
  MintGovernance = 9,
  TokenGovernance = 10,
}

export interface GovernanceAccount {
  accountType: GovernanceAccountType;
}

export type GovernanceAccountClass =
  | typeof Realm
  | typeof TokenOwnerRecord
  | typeof Governance
  | typeof Proposal
  | typeof SignatoryRecord
  | typeof VoteRecord
  | typeof ProposalInstruction;

export function getAccountTypes(accountClass: GovernanceAccountClass) {
  switch (accountClass) {
    case Realm:
      return [GovernanceAccountType.Realm];
    case TokenOwnerRecord:
      return [GovernanceAccountType.TokenOwnerRecord];
    case Proposal:
      return [GovernanceAccountType.Proposal];
    case SignatoryRecord:
      return [GovernanceAccountType.SignatoryRecord];
    case VoteRecord:
      return [GovernanceAccountType.VoteRecord];
    case ProposalInstruction:
      return [GovernanceAccountType.ProposalInstruction];
    case Governance:
      return [
        GovernanceAccountType.AccountGovernance,
        GovernanceAccountType.ProgramGovernance,
        GovernanceAccountType.MintGovernance,
        GovernanceAccountType.TokenGovernance,
      ];
    default:
      throw Error(`${accountClass} account is not supported`);
  }
}

export enum VoteThresholdPercentageType {
  YesVote = 0,
  Quorum = 1,
}

export class VoteThresholdPercentage {
  type = VoteThresholdPercentageType.YesVote;
  value: number;

  constructor(args: { value: number }) {
    this.value = args.value;
  }
}

export enum VoteWeightSource {
  Deposit,
  Snapshot,
}

export enum InstructionExecutionStatus {
  None,
  Success,
  Error,
}

export enum InstructionExecutionFlags {
  None,
  Ordered,
  UseTransaction,
}

export class Realm {
  accountType = GovernanceAccountType.Realm;

  communityMint: PublicKey;

  reserved: Uint8Array;

  councilMint: PublicKey | undefined;

  authority: PublicKey | undefined;

  name: string;

  constructor(args: {
    communityMint: PublicKey;
    reserved: Uint8Array;
    councilMint: PublicKey | undefined;
    authority: PublicKey | undefined;
    name: string;
  }) {
    this.communityMint = args.communityMint;
    this.reserved = args.reserved;
    this.councilMint = args.councilMint;
    this.authority = args.authority;
    this.name = args.name;
  }
}

export class GovernanceConfig {
  voteThresholdPercentage: VoteThresholdPercentage;
  minCommunityTokensToCreateProposal: BN;
  minInstructionHoldUpTime: number;
  maxVotingTime: number;
  voteWeightSource: VoteWeightSource;
  proposalCoolOffTime: number;
  minCouncilTokensToCreateProposal: BN;

  constructor(args: {
    voteThresholdPercentage: VoteThresholdPercentage;
    minCommunityTokensToCreateProposal: BN;
    minInstructionHoldUpTime: number;
    maxVotingTime: number;
    voteWeightSource?: VoteWeightSource;
    proposalCoolOffTime?: number;
    minCouncilTokensToCreateProposal: BN;
  }) {
    this.voteThresholdPercentage = args.voteThresholdPercentage;
    this.minCommunityTokensToCreateProposal =
      args.minCommunityTokensToCreateProposal;
    this.minInstructionHoldUpTime = args.minInstructionHoldUpTime;
    this.maxVotingTime = args.maxVotingTime;
    this.voteWeightSource = args.voteWeightSource ?? VoteWeightSource.Deposit;
    this.proposalCoolOffTime = args.proposalCoolOffTime ?? 0;
    this.minCouncilTokensToCreateProposal =
      args.minCouncilTokensToCreateProposal;
  }
}

export class Governance {
  accountType: GovernanceAccountType;
  realm: PublicKey;
  governedAccount: PublicKey;
  config: GovernanceConfig;
  proposalCount: number;
  reserved?: Uint8Array;

  constructor(args: {
    realm: PublicKey;
    governedAccount: PublicKey;
    accountType: number;
    config: GovernanceConfig;
    reserved?: Uint8Array;
    proposalCount: number;
  }) {
    this.accountType = args.accountType;
    this.realm = args.realm;
    this.governedAccount = args.governedAccount;
    this.config = args.config;
    this.reserved = args.reserved;
    this.proposalCount = args.proposalCount;
  }

  isProgramGovernance() {
    return this.accountType === GovernanceAccountType.ProgramGovernance;
  }

  isAccountGovernance() {
    return this.accountType === GovernanceAccountType.AccountGovernance;
  }

  isMintGovernance() {
    return this.accountType === GovernanceAccountType.MintGovernance;
  }

  isTokenGovernance() {
    return this.accountType === GovernanceAccountType.TokenGovernance;
  }
}

export class TokenOwnerRecord {
  accountType = GovernanceAccountType.TokenOwnerRecord;

  realm: PublicKey;

  governingTokenMint: PublicKey;

  governingTokenOwner: PublicKey;

  governingTokenDepositAmount: BN;

  unrelinquishedVotesCount: number;

  totalVotesCount: number;

  reserved: Uint8Array;

  governanceDelegate?: PublicKey;

  constructor(args: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    governingTokenOwner: PublicKey;
    governingTokenDepositAmount: BN;
    unrelinquishedVotesCount: number;
    totalVotesCount: number;
    reserved: Uint8Array;
  }) {
    this.realm = args.realm;
    this.governingTokenMint = args.governingTokenMint;
    this.governingTokenOwner = args.governingTokenOwner;
    this.governingTokenDepositAmount = args.governingTokenDepositAmount;
    this.unrelinquishedVotesCount = args.unrelinquishedVotesCount;
    this.totalVotesCount = args.totalVotesCount;
    this.reserved = args.reserved;
  }
}

export async function getTokenOwnerAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) {
  const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    programId,
  );

  return tokenOwnerRecordAddress;
}

export enum ProposalState {
  Draft,

  SigningOff,

  Voting,

  Succeeded,

  Executing,

  Completed,

  Cancelled,

  Defeated,

  ExecutingWithErrors,
}

export class Proposal {
  accountType = GovernanceAccountType.Proposal;

  governance: PublicKey;

  governingTokenMint: PublicKey;

  state: ProposalState;

  tokenOwnerRecord: PublicKey;

  signatoriesCount: number;

  signatoriesSignedOffCount: number;

  yesVotesCount: BN;

  noVotesCount: BN;

  instructionsExecutedCount: number;

  instructionsCount: number;

  instructionsNextIndex: number;

  draftAt: BN;

  signingOffAt: BN | null;

  votingAt: BN | null;

  votingAtSlot: BN | null;

  votingCompletedAt: BN | null;

  executingAt: BN | null;

  closedAt: BN | null;

  executionFlags: InstructionExecutionFlags;

  governingTokenMintVoteSupply: BN | null;

  name: string;

  descriptionLink: string;

  constructor(args: {
    governance: PublicKey;
    governingTokenMint: PublicKey;
    state: ProposalState;
    tokenOwnerRecord: PublicKey;
    signatoriesCount: number;
    signatoriesSignedOffCount: number;
    descriptionLink: string;
    name: string;
    yesVotesCount: BN;
    noVotesCount: BN;
    draftAt: BN;
    signingOffAt: BN | null;
    votingAt: BN | null;
    votingAtSlot: BN | null;
    votingCompletedAt: BN | null;
    executingAt: BN | null;
    closedAt: BN | null;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
    executionFlags: InstructionExecutionFlags;
    governingTokenMintVoteSupply: BN | null;
  }) {
    this.governance = args.governance;
    this.governingTokenMint = args.governingTokenMint;
    this.state = args.state;
    this.tokenOwnerRecord = args.tokenOwnerRecord;
    this.signatoriesCount = args.signatoriesCount;
    this.signatoriesSignedOffCount = args.signatoriesSignedOffCount;
    this.descriptionLink = args.descriptionLink;
    this.name = args.name;
    this.yesVotesCount = args.yesVotesCount;
    this.noVotesCount = args.noVotesCount;
    this.draftAt = args.draftAt;
    this.signingOffAt = args.signingOffAt;
    this.votingAt = args.votingAt;
    this.votingAtSlot = args.votingAtSlot;
    this.votingCompletedAt = args.votingCompletedAt;
    this.executingAt = args.executingAt;
    this.closedAt = args.closedAt;
    this.instructionsExecutedCount = args.instructionsExecutedCount;
    this.instructionsCount = args.instructionsCount;
    this.instructionsNextIndex = args.instructionsNextIndex;
    this.executionFlags = args.executionFlags;
    this.governingTokenMintVoteSupply = args.governingTokenMintVoteSupply;
  }
}

export class SignatoryRecord {
  accountType: GovernanceAccountType = GovernanceAccountType.SignatoryRecord;
  proposal: PublicKey;
  signatory: PublicKey;
  signedOff: boolean;

  constructor(args: {
    proposal: PublicKey;
    signatory: PublicKey;
    signedOff: boolean;
  }) {
    this.proposal = args.proposal;
    this.signatory = args.signatory;
    this.signedOff = !!args.signedOff;
  }
}

export async function getSignatoryRecordAddress(
  programId: PublicKey,
  proposal: PublicKey,
  signatory: PublicKey,
) {
  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      signatory.toBuffer(),
    ],
    programId,
  );

  return signatoryRecordAddress;
}

export class VoteWeight {
  yes: BN;
  no: BN;

  constructor(args: { yes: BN; no: BN }) {
    this.yes = args.yes;
    this.no = args.no;
  }
}

export class VoteRecord {
  accountType = GovernanceAccountType.VoteRecord;
  proposal: PublicKey;
  governingTokenOwner: PublicKey;
  isRelinquished: boolean;
  voteWeight: VoteWeight;

  constructor(args: {
    proposal: PublicKey;
    governingTokenOwner: PublicKey;
    isRelinquished: boolean;
    voteWeight: VoteWeight;
  }) {
    this.proposal = args.proposal;
    this.governingTokenOwner = args.governingTokenOwner;
    this.isRelinquished = !!args.isRelinquished;
    this.voteWeight = args.voteWeight;
  }
}

export class AccountMetaData {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;

  constructor(args: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }) {
    this.pubkey = args.pubkey;
    this.isSigner = !!args.isSigner;
    this.isWritable = !!args.isWritable;
  }
}

export class InstructionData {
  programId: PublicKey;
  accounts: AccountMetaData[];
  data: Uint8Array;

  constructor(args: {
    programId: PublicKey;
    accounts: AccountMetaData[];
    data: Uint8Array;
  }) {
    this.programId = args.programId;
    this.accounts = args.accounts;
    this.data = args.data;
  }
}

export class ProposalInstruction {
  accountType = GovernanceAccountType.ProposalInstruction;
  proposal: PublicKey;
  instructionIndex: number;
  holdUpTime: number;
  instruction: InstructionData;
  executedAt: BN | null;
  executionStatus: InstructionExecutionStatus;

  constructor(args: {
    proposal: PublicKey;
    instructionIndex: number;
    holdUpTime: number;
    instruction: InstructionData;
    executedAt: BN | null;
    executionStatus: InstructionExecutionStatus;
  }) {
    this.proposal = args.proposal;
    this.instructionIndex = args.instructionIndex;
    this.holdUpTime = args.holdUpTime;
    this.instruction = args.instruction;
    this.executedAt = args.executedAt;
    this.executionStatus = args.executionStatus;
  }
}
