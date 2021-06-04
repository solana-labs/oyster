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

  // --- OLD

  ProposalOld = 10,
  ProposalState = 11,
  CustomSingleSignerTransaction = 12,
}

export class Realm {
  accountType = GovernanceAccountType.Realm;

  communityMint: PublicKey;

  councilMint?: PublicKey | null;

  name: string;

  constructor(args: {
    communityMint: PublicKey;
    councilMint?: string;
    name: string;
  }) {
    this.communityMint = args.communityMint;

    this.councilMint = args.councilMint
      ? new PublicKey(args.councilMint)
      : null;

    this.name = args.name;
  }
}

export class GovernanceConfig {
  realm: PublicKey;
  governedAccount: PublicKey;
  yesVoteThresholdPercentage: number;
  minTokensToCreateProposal: number;
  minInstructionHoldUpTime: BN;
  maxVotingTime: BN;

  constructor(args: {
    realm: PublicKey;
    governedAccount: PublicKey;
    yesVoteThresholdPercentage: number;
    minTokensToCreateProposal: number;
    minInstructionHoldUpTime: BN;
    maxVotingTime: BN;
  }) {
    this.realm = args.realm;
    this.governedAccount = args.governedAccount;
    this.yesVoteThresholdPercentage = args.yesVoteThresholdPercentage;
    this.minTokensToCreateProposal = args.minTokensToCreateProposal;
    this.minInstructionHoldUpTime = args.minInstructionHoldUpTime;
    this.maxVotingTime = args.maxVotingTime;
  }
}

export class Governance {
  accountType: GovernanceAccountType;
  config: GovernanceConfig;
  proposalCount: number;

  constructor(args: {
    accountType: number;
    config: GovernanceConfig;
    proposalCount: number;
  }) {
    this.accountType = args.accountType;
    this.config = args.config;
    this.proposalCount = args.proposalCount;
  }
}

export class TokenOwnerRecord {
  accountType = GovernanceAccountType.TokenOwnerRecord;

  realm: PublicKey;

  governingTokenMint: PublicKey;

  governingTokenOwner: PublicKey;

  governingTokenDepositAmount: BN;

  governanceDelegate?: PublicKey;

  unrelinquishedVotesCount: number;

  totalVotesCount: number;

  constructor(args: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    governingTokenOwner: PublicKey;
    governingTokenDepositAmount: BN;
    unrelinquishedVotesCount: number;
    totalVotesCount: number;
  }) {
    this.realm = args.realm;
    this.governingTokenMint = args.governingTokenMint;
    this.governingTokenOwner = args.governingTokenOwner;
    this.governingTokenDepositAmount = args.governingTokenDepositAmount;
    this.unrelinquishedVotesCount = args.unrelinquishedVotesCount;
    this.totalVotesCount = args.totalVotesCount;
  }
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
}

export class Proposal {
  accountType = GovernanceAccountType.Proposal;

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

  votingCompletedAt: BN | null;

  executingAt: BN | null;

  closedAt: BN | null;

  instructionsExecutedCount: number;

  instructionsCount: number;

  instructionsNextIndex: number;

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
    votingCompletedAt: BN | null;
    executingAt: BN | null;
    closedAt: BN | null;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
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
    this.votingCompletedAt = args.votingCompletedAt;
    this.executingAt = args.executingAt;
    this.closedAt = args.closedAt;
    this.instructionsExecutedCount = args.instructionsExecutedCount;
    this.instructionsCount = args.instructionsCount;
    this.instructionsNextIndex = args.instructionsNextIndex;
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
