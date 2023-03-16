import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { Vote, VoteKind } from './instructions';
import {
  ACCOUNT_VERSION_V1,
  ACCOUNT_VERSION_V2,
  PROGRAM_VERSION_V1,
} from '../registry/constants';

/// Seed  prefix for Governance Program PDAs
export const GOVERNANCE_PROGRAM_SEED = 'governance';

export enum GovernanceAccountType {
  Uninitialized = 0,
  RealmV1 = 1,
  TokenOwnerRecordV1 = 2,
  GovernanceV1 = 3,
  ProgramGovernanceV1 = 4,
  ProposalV1 = 5,
  SignatoryRecordV1 = 6,
  VoteRecordV1 = 7,
  ProposalInstructionV1 = 8,
  MintGovernanceV1 = 9,
  TokenGovernanceV1 = 10,
  RealmConfig = 11,
  VoteRecordV2 = 12,
  ProposalTransactionV2 = 13,
  ProposalV2 = 14,
  ProgramMetadata = 15,
  RealmV2 = 16,
  TokenOwnerRecordV2 = 17,
  GovernanceV2 = 18,
  ProgramGovernanceV2 = 19,
  MintGovernanceV2 = 20,
  TokenGovernanceV2 = 21,
  SignatoryRecordV2 = 22,
  ProposalDeposit = 23,
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
  | typeof ProposalTransaction
  | typeof RealmConfigAccount
  | typeof ProgramMetadata
  | typeof ProposalDeposit;

export function getAccountTypes(accountClass: GovernanceAccountClass) {
  switch (accountClass) {
    case Realm:
      return [GovernanceAccountType.RealmV1, GovernanceAccountType.RealmV2];
    case TokenOwnerRecord:
      return [
        GovernanceAccountType.TokenOwnerRecordV1,
        GovernanceAccountType.TokenOwnerRecordV2,
      ];
    case Proposal:
      return [
        GovernanceAccountType.ProposalV1,
        GovernanceAccountType.ProposalV2,
      ];
    case ProposalDeposit:
      return [GovernanceAccountType.ProposalDeposit];
    case SignatoryRecord:
      return [
        GovernanceAccountType.SignatoryRecordV1,
        GovernanceAccountType.SignatoryRecordV2,
      ];
    case VoteRecord:
      return [
        GovernanceAccountType.VoteRecordV1,
        GovernanceAccountType.VoteRecordV2,
      ];
    case ProposalTransaction:
      return [
        GovernanceAccountType.ProposalInstructionV1,
        GovernanceAccountType.ProposalTransactionV2,
      ];
    case RealmConfigAccount:
      return [GovernanceAccountType.RealmConfig];
    case Governance:
      return [
        GovernanceAccountType.GovernanceV1,
        GovernanceAccountType.ProgramGovernanceV1,
        GovernanceAccountType.MintGovernanceV1,
        GovernanceAccountType.TokenGovernanceV1,
        GovernanceAccountType.GovernanceV2,
        GovernanceAccountType.ProgramGovernanceV2,
        GovernanceAccountType.MintGovernanceV2,
        GovernanceAccountType.TokenGovernanceV2,
      ];
    case ProgramMetadata:
      return [GovernanceAccountType.ProgramMetadata];
    default:
      throw Error(`${accountClass} account is not supported`);
  }
}

export function getGovernanceAccountVersion(
  accountType: GovernanceAccountType,
) {
  switch (accountType) {
    case GovernanceAccountType.VoteRecordV2:
    case GovernanceAccountType.ProposalTransactionV2:
    case GovernanceAccountType.ProposalV2:
    case GovernanceAccountType.RealmV2:
    case GovernanceAccountType.TokenOwnerRecordV2:
    case GovernanceAccountType.GovernanceV2:
    case GovernanceAccountType.ProgramGovernanceV2:
    case GovernanceAccountType.MintGovernanceV2:
    case GovernanceAccountType.TokenGovernanceV2:
    case GovernanceAccountType.SignatoryRecordV2:
      return ACCOUNT_VERSION_V2;
    default:
      return ACCOUNT_VERSION_V1;
  }
}

export enum VoteThresholdType {
  // Approval Quorum
  YesVotePercentage = 0,
  // Not supported in the current version
  QuorumPercentage = 1,
  // Supported for VERSION >= 3
  Disabled = 2,
}

export class VoteThreshold {
  type: VoteThresholdType;
  value: number | undefined;

  constructor(args: { type: VoteThresholdType; value?: number | undefined }) {
    this.type = args.type;
    this.value = args.value;
  }
}

export enum VoteTipping {
  Strict,
  Early, // V2 Only
  Disabled, // V2 Only
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

export enum MintMaxVoteWeightSourceType {
  SupplyFraction = 0,
  Absolute = 1,
}

export class MintMaxVoteWeightSource {
  type: MintMaxVoteWeightSourceType;
  value: BN;

  constructor(args: { type: MintMaxVoteWeightSourceType; value: BN }) {
    this.type = args.type;
    this.value = args.value;
  }

  static SUPPLY_FRACTION_BASE = new BN(10000000000);
  static SUPPLY_FRACTION_DECIMALS = 10;

  static FULL_SUPPLY_FRACTION = new MintMaxVoteWeightSource({
    type: MintMaxVoteWeightSourceType.SupplyFraction,
    value: MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE,
  });

  isFullSupply() {
    return (
      this.type === MintMaxVoteWeightSourceType.SupplyFraction &&
      this.value.cmp(MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE) === 0
    );
  }
  getSupplyFraction() {
    if (this.type !== MintMaxVoteWeightSourceType.SupplyFraction) {
      throw new Error('Max vote weight is not fraction');
    }

    return this.value;
  }
  fmtSupplyFractionPercentage() {
    return new BigNumber(this.getSupplyFraction() as any)
      .shiftedBy(-MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS + 2)
      .toFormat();
  }
}

export enum VoteTypeKind {
  SingleChoice = 0,
  MultiChoice = 1,
}

export class VoteType {
  type: VoteTypeKind;
  choiceCount: number | undefined;

  constructor(args: { type: VoteTypeKind; choiceCount: number | undefined }) {
    this.type = args.type;
    this.choiceCount = args.choiceCount;
  }

  static SINGLE_CHOICE = new VoteType({
    type: VoteTypeKind.SingleChoice,
    choiceCount: undefined,
  });

  static MULTI_CHOICE = (choiceCount: number) =>
    new VoteType({
      type: VoteTypeKind.MultiChoice,
      choiceCount: choiceCount,
    });

  isSingleChoice() {
    return this.type === VoteTypeKind.SingleChoice;
  }
}

export class RealmConfigArgs {
  useCouncilMint: boolean;
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
  minCommunityTokensToCreateGovernance: BN;

  // Version == 2
  useCommunityVoterWeightAddin: boolean;
  useMaxCommunityVoterWeightAddin: boolean;

  // Versions >= 3
  communityTokenConfigArgs: GoverningTokenConfigArgs;
  councilTokenConfigArgs: GoverningTokenConfigArgs;

  constructor(args: {
    useCouncilMint: boolean;

    minCommunityTokensToCreateGovernance: BN;
    communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;

    // Version == 2
    useCommunityVoterWeightAddin: boolean;
    useMaxCommunityVoterWeightAddin: boolean;

    // Versions >= 3
    communityTokenConfigArgs: GoverningTokenConfigArgs;
    councilTokenConfigArgs: GoverningTokenConfigArgs;
  }) {
    this.useCouncilMint = !!args.useCouncilMint;
    this.communityMintMaxVoteWeightSource =
      args.communityMintMaxVoteWeightSource;
    this.minCommunityTokensToCreateGovernance =
      args.minCommunityTokensToCreateGovernance;

    this.useCommunityVoterWeightAddin = args.useCommunityVoterWeightAddin;
    this.useMaxCommunityVoterWeightAddin = args.useMaxCommunityVoterWeightAddin;

    this.communityTokenConfigArgs = args.communityTokenConfigArgs;
    this.councilTokenConfigArgs = args.councilTokenConfigArgs;
  }
}

export enum GoverningTokenType {
  Liquid = 0,
  Membership = 1,
  Dormant = 2,
}

export class GoverningTokenConfigArgs {
  useVoterWeightAddin: boolean;
  useMaxVoterWeightAddin: boolean;
  tokenType: GoverningTokenType;

  constructor(args: {
    useVoterWeightAddin: boolean;
    useMaxVoterWeightAddin: boolean;
    tokenType: GoverningTokenType;
  }) {
    this.useVoterWeightAddin = args.useVoterWeightAddin;
    this.useMaxVoterWeightAddin = args.useMaxVoterWeightAddin;
    this.tokenType = args.tokenType;
  }
}

export class GoverningTokenConfigAccountArgs {
  voterWeightAddin: PublicKey | undefined;
  maxVoterWeightAddin: PublicKey | undefined;
  tokenType: GoverningTokenType;

  constructor(args: {
    voterWeightAddin: PublicKey | undefined;
    maxVoterWeightAddin: PublicKey | undefined;
    tokenType: GoverningTokenType;
  }) {
    this.voterWeightAddin = args.voterWeightAddin;
    this.maxVoterWeightAddin = args.maxVoterWeightAddin;
    this.tokenType = args.tokenType;
  }
}

export class RealmConfig {
  councilMint: PublicKey | undefined;
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
  minCommunityTokensToCreateGovernance: BN;

  // VERSION == 2
  useCommunityVoterWeightAddin: boolean;
  useMaxCommunityVoterWeightAddin: boolean;

  reserved: Uint8Array;

  constructor(args: {
    councilMint: PublicKey | undefined;
    communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
    minCommunityTokensToCreateGovernance: BN;
    reserved: Uint8Array;
    useCommunityVoterWeightAddin: boolean;
    useMaxCommunityVoterWeightAddin: boolean;
  }) {
    this.councilMint = args.councilMint;
    this.communityMintMaxVoteWeightSource =
      args.communityMintMaxVoteWeightSource;
    this.minCommunityTokensToCreateGovernance =
      args.minCommunityTokensToCreateGovernance;
    this.useCommunityVoterWeightAddin = !!args.useCommunityVoterWeightAddin;
    this.useMaxCommunityVoterWeightAddin = !!args.useMaxCommunityVoterWeightAddin;
    this.reserved = args.reserved;
  }
}

export class Realm {
  accountType = GovernanceAccountType.RealmV1;

  communityMint: PublicKey;

  config: RealmConfig;

  reserved: Uint8Array;

  // Not used in versions >= V3 / legacy1
  votingProposalCount: number;

  authority: PublicKey | undefined;

  name: string;

  constructor(args: {
    communityMint: PublicKey;
    reserved: Uint8Array;
    config: RealmConfig;
    votingProposalCount: number;
    authority: PublicKey | undefined;
    name: string;
  }) {
    this.communityMint = args.communityMint;
    this.config = args.config;
    this.reserved = args.reserved;
    this.votingProposalCount = args.votingProposalCount;
    this.authority = args.authority;
    this.name = args.name;
  }
}

export async function getTokenHoldingAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
) {
  const [tokenHoldingAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    programId,
  );

  return tokenHoldingAddress;
}

export class GoverningTokenConfig {
  voterWeightAddin: PublicKey | undefined;
  maxVoterWeightAddin: PublicKey | undefined;
  tokenType: GoverningTokenType;
  reserved: Uint8Array;

  constructor(args: {
    voterWeightAddin: PublicKey | undefined;
    maxVoterWeightAddin: PublicKey | undefined;
    tokenType: GoverningTokenType;
    reserved: Uint8Array;
  }) {
    this.voterWeightAddin = args.voterWeightAddin;
    this.maxVoterWeightAddin = args.maxVoterWeightAddin;
    this.tokenType = args.tokenType;
    this.reserved = args.reserved;
  }
}

export class RealmConfigAccount {
  accountType = GovernanceAccountType.RealmConfig;

  realm: PublicKey;
  communityTokenConfig: GoverningTokenConfig;
  councilTokenConfig: GoverningTokenConfig;

  reserved: Uint8Array;

  constructor(args: {
    realm: PublicKey;
    communityTokenConfig: GoverningTokenConfig;
    councilTokenConfig: GoverningTokenConfig;
    reserved: Uint8Array;
  }) {
    this.realm = args.realm;
    this.communityTokenConfig = args.communityTokenConfig;
    this.councilTokenConfig = args.councilTokenConfig;
    this.reserved = args.reserved;
  }
}

export async function getRealmConfigAddress(
  programId: PublicKey,
  realm: PublicKey,
) {
  const [realmConfigAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('realm-config'), realm.toBuffer()],
    programId,
  );

  return realmConfigAddress;
}

export class GovernanceConfig {
  communityVoteThreshold: VoteThreshold;

  minCommunityTokensToCreateProposal: BN;
  minInstructionHoldUpTime: number;
  baseVotingTime: number;
  communityVoteTipping: VoteTipping;
  minCouncilTokensToCreateProposal: BN;

  // VERSION >= 3
  councilVoteThreshold: VoteThreshold;
  councilVetoVoteThreshold: VoteThreshold;
  communityVetoVoteThreshold: VoteThreshold;
  councilVoteTipping: VoteTipping;
  votingCoolOffTime: number;
  depositExemptProposalCount: number;

  constructor(args: {
    communityVoteThreshold: VoteThreshold;
    minCommunityTokensToCreateProposal: BN;
    minInstructionHoldUpTime: number;
    baseVotingTime: number;
    communityVoteTipping?: VoteTipping;
    minCouncilTokensToCreateProposal: BN;

    // VERSION >= 3
    // For versions < 3 must be set to YesVotePercentage(0)
    councilVoteThreshold?: VoteThreshold;
    councilVetoVoteThreshold?: VoteThreshold;
    communityVetoVoteThreshold?: VoteThreshold;
    councilVoteTipping?: VoteTipping;
    votingCoolOffTime?: number;
    depositExemptProposalCount?: number;
  }) {
    this.communityVoteThreshold = args.communityVoteThreshold;
    this.minCommunityTokensToCreateProposal =
      args.minCommunityTokensToCreateProposal;
    this.minInstructionHoldUpTime = args.minInstructionHoldUpTime;
    this.baseVotingTime = args.baseVotingTime;
    this.communityVoteTipping = args.communityVoteTipping ?? VoteTipping.Strict;
    this.minCouncilTokensToCreateProposal =
      args.minCouncilTokensToCreateProposal;

    // VERSION >= 3
    this.councilVoteThreshold =
      args.councilVoteThreshold ?? args.communityVoteThreshold;
    this.councilVetoVoteThreshold =
      args.councilVetoVoteThreshold ?? args.communityVoteThreshold;

    this.communityVetoVoteThreshold =
      args.communityVetoVoteThreshold ??
      new VoteThreshold({ type: VoteThresholdType.Disabled });

    this.councilVoteTipping =
      args.councilVoteTipping ?? this.communityVoteTipping;

    this.votingCoolOffTime = args.votingCoolOffTime ?? 0;
    this.depositExemptProposalCount = args.depositExemptProposalCount ?? 0;
  }

  get maxVotingTime() {
    return this.baseVotingTime + this.votingCoolOffTime;
  }
}

export class Governance {
  accountType: GovernanceAccountType;
  realm: PublicKey;
  governedAccount: PublicKey;
  config: GovernanceConfig;
  // proposalCount is not used for  >= V3
  proposalCount: number;
  reserved?: Uint8Array;

  // V3
  activeProposalCount: BN;

  constructor(args: {
    realm: PublicKey;
    governedAccount: PublicKey;
    accountType: number;
    config: GovernanceConfig;
    reserved?: Uint8Array;
    proposalCount: number;
    activeProposalCount: BN;
  }) {
    this.accountType = args.accountType;
    this.realm = args.realm;
    this.governedAccount = args.governedAccount;
    this.config = args.config;
    this.reserved = args.reserved;
    this.proposalCount = args.proposalCount;
    this.activeProposalCount = args.activeProposalCount;
  }

  isProgramGovernance() {
    return (
      this.accountType === GovernanceAccountType.ProgramGovernanceV1 ||
      this.accountType === GovernanceAccountType.ProgramGovernanceV2
    );
  }

  isAccountGovernance() {
    return (
      this.accountType === GovernanceAccountType.GovernanceV1 ||
      this.accountType === GovernanceAccountType.GovernanceV2
    );
  }

  isMintGovernance() {
    return (
      this.accountType === GovernanceAccountType.MintGovernanceV1 ||
      this.accountType === GovernanceAccountType.MintGovernanceV2
    );
  }

  isTokenGovernance() {
    return (
      this.accountType === GovernanceAccountType.TokenGovernanceV1 ||
      this.accountType === GovernanceAccountType.TokenGovernanceV2
    );
  }
}

export class TokenOwnerRecord {
  accountType = GovernanceAccountType.TokenOwnerRecordV1;

  realm: PublicKey;

  governingTokenMint: PublicKey;

  governingTokenOwner: PublicKey;

  governingTokenDepositAmount: BN;

  unrelinquishedVotesCount: number;

  // Not used in versions >= V3 / I'ts the upper 4 bytes of unrelinquishedVotesCount
  totalVotesCount: number;

  outstandingProposalCount: number;

  reserved: Uint8Array;

  governanceDelegate?: PublicKey;

  // V3
  version: number;

  constructor(args: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    governingTokenOwner: PublicKey;
    governingTokenDepositAmount: BN;
    unrelinquishedVotesCount: number;
    totalVotesCount: number;
    outstandingProposalCount: number;
    reserved: Uint8Array;
    governanceDelegate: PublicKey | undefined;
    version: number;
  }) {
    this.realm = args.realm;
    this.governingTokenMint = args.governingTokenMint;
    this.governingTokenOwner = args.governingTokenOwner;
    this.governingTokenDepositAmount = args.governingTokenDepositAmount;
    this.unrelinquishedVotesCount = args.unrelinquishedVotesCount;
    this.totalVotesCount = args.totalVotesCount;
    this.outstandingProposalCount = args.outstandingProposalCount;
    this.reserved = args.reserved;
    this.governanceDelegate = args.governanceDelegate;
    this.version = args.version;
  }
}

export async function getTokenOwnerRecordAddress(
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

  Vetoed,
}

export enum OptionVoteResult {
  None,
  Succeeded,
  Defeated,
}

export class ProposalOption {
  label: string;
  voteWeight: BN;
  voteResult: OptionVoteResult;

  instructionsExecutedCount: number;
  instructionsCount: number;
  instructionsNextIndex: number;

  constructor(args: {
    label: string;
    voteWeight: BN;
    voteResult: OptionVoteResult;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
  }) {
    this.label = args.label;
    this.voteWeight = args.voteWeight;
    this.voteResult = args.voteResult;
    this.instructionsExecutedCount = args.instructionsExecutedCount;
    this.instructionsCount = args.instructionsCount;
    this.instructionsNextIndex = args.instructionsNextIndex;
  }
}

export class Proposal {
  accountType: GovernanceAccountType;

  governance: PublicKey;

  governingTokenMint: PublicKey;

  state: ProposalState;

  tokenOwnerRecord: PublicKey;

  signatoriesCount: number;

  signatoriesSignedOffCount: number;

  // V1 -----------------------------
  yesVotesCount: BN;
  noVotesCount: BN;
  instructionsExecutedCount: number;
  instructionsCount: number;
  instructionsNextIndex: number;
  // --------------------------------

  // V2 -----------------------------
  voteType: VoteType;
  options: ProposalOption[];
  denyVoteWeight: BN | undefined;
  reserved1: number;
  abstainVoteWeight: BN | undefined;
  startVotingAt: BN | null;
  maxVotingTime: number | null;
  // --------------------------------

  draftAt: BN;

  signingOffAt: BN | null;

  votingAt: BN | null;

  votingAtSlot: BN | null;

  votingCompletedAt: BN | null;

  executingAt: BN | null;

  closedAt: BN | null;

  executionFlags: InstructionExecutionFlags;

  maxVoteWeight: BN | null;
  voteThreshold: VoteThreshold | null;

  name: string;

  descriptionLink: string;

  // V3
  vetoVoteWeight: BN;

  constructor(args: {
    accountType: GovernanceAccountType;
    governance: PublicKey;
    governingTokenMint: PublicKey;
    state: ProposalState;
    tokenOwnerRecord: PublicKey;
    signatoriesCount: number;
    signatoriesSignedOffCount: number;
    descriptionLink: string;
    name: string;
    // V1
    yesVotesCount: BN;
    noVotesCount: BN;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
    //

    // V2
    voteType: VoteType;
    options: ProposalOption[];
    denyVoteWeight: BN | undefined;
    reserved1: number;
    abstainVoteWeight: BN | undefined;
    startVotingAt: BN | null;
    maxVotingTime: number | null;
    //

    draftAt: BN;
    signingOffAt: BN | null;
    votingAt: BN | null;
    votingAtSlot: BN | null;
    votingCompletedAt: BN | null;
    executingAt: BN | null;
    closedAt: BN | null;

    executionFlags: InstructionExecutionFlags;
    maxVoteWeight: BN | null;
    voteThreshold: VoteThreshold | null;

    // V3
    vetoVoteWeight: BN;
  }) {
    this.accountType = args.accountType;
    this.governance = args.governance;
    this.governingTokenMint = args.governingTokenMint;
    this.state = args.state;
    this.tokenOwnerRecord = args.tokenOwnerRecord;
    this.signatoriesCount = args.signatoriesCount;
    this.signatoriesSignedOffCount = args.signatoriesSignedOffCount;
    this.descriptionLink = args.descriptionLink;
    this.name = args.name;

    // V1
    this.yesVotesCount = args.yesVotesCount;
    this.noVotesCount = args.noVotesCount;
    this.instructionsExecutedCount = args.instructionsExecutedCount;
    this.instructionsCount = args.instructionsCount;
    this.instructionsNextIndex = args.instructionsNextIndex;
    //

    // V2
    this.voteType = args.voteType;
    this.options = args.options;
    this.denyVoteWeight = args.denyVoteWeight;
    this.reserved1 = args.reserved1;
    this.abstainVoteWeight = args.abstainVoteWeight;

    this.startVotingAt = args.startVotingAt;
    this.maxVotingTime = args.maxVotingTime;

    this.draftAt = args.draftAt;
    this.signingOffAt = args.signingOffAt;
    this.votingAt = args.votingAt;
    this.votingAtSlot = args.votingAtSlot;
    this.votingCompletedAt = args.votingCompletedAt;
    this.executingAt = args.executingAt;
    this.closedAt = args.closedAt;

    this.executionFlags = args.executionFlags;
    this.maxVoteWeight = args.maxVoteWeight;
    this.voteThreshold = args.voteThreshold;

    // V3
    this.vetoVoteWeight = args.vetoVoteWeight;
  }

  /// Returns true if Proposal is in state when no voting can happen any longer
  isVoteFinalized(): boolean {
    switch (this.state) {
      case ProposalState.Succeeded:
      case ProposalState.Executing:
      case ProposalState.Completed:
      case ProposalState.Cancelled:
      case ProposalState.Defeated:
      case ProposalState.ExecutingWithErrors:
      case ProposalState.Vetoed:
        return true;
      case ProposalState.Draft:
      case ProposalState.SigningOff:
      case ProposalState.Voting:
        return false;
    }
  }

  isFinalState(): boolean {
    // 1) ExecutingWithErrors is not really a final state, it's undefined.
    //    However it usually indicates none recoverable execution error so we treat is as final for the ui purposes
    // 2) Succeeded with no instructions is also treated as final since it can't transition any longer
    //    It really doesn't make any sense but until it's solved in the program we have to consider it as final in the ui
    switch (this.state) {
      case ProposalState.Completed:
      case ProposalState.Cancelled:
      case ProposalState.Defeated:
      case ProposalState.ExecutingWithErrors:
      case ProposalState.Vetoed:
        return true;
      case ProposalState.Succeeded:
        return this.instructionsCount === 0;
      case ProposalState.Executing:
      case ProposalState.Draft:
      case ProposalState.SigningOff:
      case ProposalState.Voting:
        return false;
    }
  }

  getStateTimestamp(): number {
    switch (this.state) {
      case ProposalState.Succeeded:
      case ProposalState.Defeated:
      case ProposalState.Vetoed:
        return this.votingCompletedAt ? this.votingCompletedAt.toNumber() : 0;
      case ProposalState.Completed:
      case ProposalState.Cancelled:
        return this.closedAt ? this.closedAt.toNumber() : 0;
      case ProposalState.Executing:
      case ProposalState.ExecutingWithErrors:
        return this.executingAt ? this.executingAt.toNumber() : 0;
      case ProposalState.Draft:
        return this.draftAt.toNumber();
      case ProposalState.SigningOff:
        return this.signingOffAt ? this.signingOffAt.toNumber() : 0;
      case ProposalState.Voting:
        return this.votingAt ? this.votingAt.toNumber() : 0;
    }
  }

  getStateSortRank(): number {
    // Always show proposals in voting state at the top
    if (this.state === ProposalState.Voting) {
      return 2;
    }
    // Then show proposals in pending state and finalized at the end
    return this.isFinalState() ? 0 : 1;
  }

  /// Returns true if Proposal has not been voted on yet
  isPreVotingState() {
    return !this.votingAtSlot;
  }

  getYesVoteOption() {
    if (this.options.length !== 1 && !this.voteType.isSingleChoice()) {
      throw new Error('Proposal is not Yes/No vote');
    }

    return this.options[0];
  }

  getYesVoteCount() {
    switch (this.accountType) {
      case GovernanceAccountType.ProposalV1:
        return this.yesVotesCount;
      case GovernanceAccountType.ProposalV2:
        return this.getYesVoteOption().voteWeight;
      default:
        throw new Error(`Invalid account type ${this.accountType}`);
    }
  }

  getNoVoteCount() {
    switch (this.accountType) {
      case GovernanceAccountType.ProposalV1:
        return this.noVotesCount;
      case GovernanceAccountType.ProposalV2:
        return this.denyVoteWeight as BN;
      default:
        throw new Error(`Invalid account type ${this.accountType}`);
    }
  }

  getTimeToVoteEnd(governance: Governance) {
    const unixTimestampInSeconds = Date.now() / 1000;

    return this.isPreVotingState()
      ? governance.config.maxVotingTime
      : (this.votingAt?.toNumber() ?? 0) +
          governance.config.maxVotingTime +
          unixTimestampInSeconds;
  }

  hasVoteTimeEnded(governance: Governance) {
    return this.getTimeToVoteEnd(governance) < 0;
  }

  canCancel(governance: Governance) {
    if (
      this.state === ProposalState.Draft ||
      this.state === ProposalState.SigningOff
    ) {
      return true;
    }

    if (
      this.state === ProposalState.Voting &&
      !this.hasVoteTimeEnded(governance)
    ) {
      return true;
    }

    return false;
  }

  canWalletCancel(
    governance: Governance,
    proposalOwner: TokenOwnerRecord,
    walletPk: PublicKey,
  ) {
    if (!this.canCancel(governance)) {
      return false;
    }
    return (
      proposalOwner.governingTokenOwner.equals(walletPk) ||
      proposalOwner.governanceDelegate?.equals(walletPk)
    );
  }
}

export class ProposalDeposit {
  accountType: GovernanceAccountType = GovernanceAccountType.ProposalDeposit;
  proposal: PublicKey;
  depositPayer: PublicKey;

  constructor(args: { proposal: PublicKey; depositPayer: PublicKey }) {
    this.proposal = args.proposal;
    this.depositPayer = args.depositPayer;
  }
}

export class SignatoryRecord {
  accountType: GovernanceAccountType = GovernanceAccountType.SignatoryRecordV1;
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
  accountType: GovernanceAccountType;
  proposal: PublicKey;
  governingTokenOwner: PublicKey;
  isRelinquished: boolean;

  // V1
  voteWeight: VoteWeight | undefined;

  // V2 -------------------------------
  voterWeight: BN | undefined;
  vote: Vote | undefined;
  // -------------------------------

  constructor(args: {
    accountType: GovernanceAccountType;
    proposal: PublicKey;
    governingTokenOwner: PublicKey;
    isRelinquished: boolean;
    // V1
    voteWeight: VoteWeight | undefined;
    // V2 -------------------------------
    voterWeight: BN | undefined;
    vote: Vote | undefined;
    // -------------------------------
  }) {
    this.accountType = args.accountType;
    this.proposal = args.proposal;
    this.governingTokenOwner = args.governingTokenOwner;
    this.isRelinquished = !!args.isRelinquished;
    // V1
    this.voteWeight = args.voteWeight;
    // V2 -------------------------------
    this.voterWeight = args.voterWeight;
    this.vote = args.vote;
    // -------------------------------
  }

  getNoVoteWeight() {
    switch (this.accountType) {
      case GovernanceAccountType.VoteRecordV1: {
        return this.voteWeight?.no;
      }
      case GovernanceAccountType.VoteRecordV2: {
        switch (this.vote?.voteType) {
          case VoteKind.Approve: {
            return undefined;
          }
          case VoteKind.Deny: {
            return this.voterWeight;
          }
          default:
            throw new Error('Invalid voteKind');
        }
      }
      default:
        throw new Error(`Invalid account type ${this.accountType} `);
    }
  }
  getYesVoteWeight() {
    switch (this.accountType) {
      case GovernanceAccountType.VoteRecordV1: {
        return this.voteWeight?.yes;
      }
      case GovernanceAccountType.VoteRecordV2: {
        switch (this.vote?.voteType) {
          case VoteKind.Approve: {
            return this.voterWeight;
          }
          case VoteKind.Deny: {
            return undefined;
          }
          default:
            throw new Error('Invalid voteKind');
        }
      }
      default:
        throw new Error(`Invalid account type ${this.accountType} `);
    }
  }
}

export async function getVoteRecordAddress(
  programId: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
) {
  const [voteRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      tokenOwnerRecord.toBuffer(),
    ],
    programId,
  );

  return voteRecordAddress;
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

export class ProposalTransaction {
  accountType;
  proposal: PublicKey;
  instructionIndex: number;

  // V1
  instruction: InstructionData;

  // V2
  optionIndex: number;
  instructions: InstructionData[];

  holdUpTime: number;

  executedAt: BN | null;
  executionStatus: InstructionExecutionStatus;

  constructor(args: {
    accountType: GovernanceAccountType;
    proposal: PublicKey;
    instructionIndex: number;
    optionIndex: number;
    holdUpTime: number;
    instruction: InstructionData;
    executedAt: BN | null;
    executionStatus: InstructionExecutionStatus;
    instructions: InstructionData[];
  }) {
    this.accountType = args.accountType;
    this.proposal = args.proposal;
    this.instructionIndex = args.instructionIndex;
    this.optionIndex = args.optionIndex;
    this.holdUpTime = args.holdUpTime;
    this.instruction = args.instruction;
    this.executedAt = args.executedAt;
    this.executionStatus = args.executionStatus;
    this.instructions = args.instructions;
  }

  getSingleInstruction() {
    if (this.accountType === GovernanceAccountType.ProposalInstructionV1) {
      return this.instruction;
    }

    if (this.instructions.length === 0) {
      throw new Error(`Transaction has no instructions`);
    }
    if (this.instructions.length > 1) {
      throw new Error(`Transaction has multiple instructions`);
    }

    return this.instructions[0];
  }

  getAllInstructions() {
    if (this.accountType === GovernanceAccountType.ProposalInstructionV1) {
      return [this.instruction];
    }

    return this.instructions;
  }
}

export async function getProposalTransactionAddress(
  programId: PublicKey,
  programVersion: number,
  proposal: PublicKey,
  optionIndex: number,
  transactionIndex: number,
) {
  let optionIndexBuffer = Buffer.alloc(1);
  optionIndexBuffer.writeUInt8(optionIndex);

  let instructionIndexBuffer = Buffer.alloc(2);
  instructionIndexBuffer.writeInt16LE(transactionIndex, 0);

  const seeds =
    programVersion === PROGRAM_VERSION_V1
      ? [
          Buffer.from(GOVERNANCE_PROGRAM_SEED),
          proposal.toBuffer(),
          instructionIndexBuffer,
        ]
      : [
          Buffer.from(GOVERNANCE_PROGRAM_SEED),
          proposal.toBuffer(),
          optionIndexBuffer,
          instructionIndexBuffer,
        ];

  const [instructionAddress] = await PublicKey.findProgramAddress(
    seeds,
    programId,
  );

  return instructionAddress;
}

export class ProgramMetadata {
  accountType = GovernanceAccountType.ProgramMetadata;

  updatedAt: BN;

  version: string;

  reserved: Uint8Array;

  constructor(args: {
    updatedAt: BN;
    reserved: Uint8Array;

    version: string;
  }) {
    this.updatedAt = args.updatedAt;
    this.reserved = args.reserved;
    this.version = args.version;
  }
}

export async function getProgramMetadataAddress(programId: PublicKey) {
  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('metadata')],
    programId,
  );

  return signatoryRecordAddress;
}

export async function getNativeTreasuryAddress(
  programId: PublicKey,
  governance: PublicKey,
) {
  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('native-treasury'), governance.toBuffer()],
    programId,
  );

  return signatoryRecordAddress;
}

export async function getGoverningTokenHoldingAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
) {
  const [governingTokenHoldingAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    programId,
  );

  return governingTokenHoldingAddress;
}

export async function getProposalDepositAddress(
  programId: PublicKey,
  proposal: PublicKey,
  proposalDepositPayer: PublicKey,
) {
  const [proposalDepositAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('proposal-deposit'),
      proposal.toBuffer(),
      proposalDepositPayer.toBuffer(),
    ],
    programId,
  );

  return proposalDepositAddress;
}
