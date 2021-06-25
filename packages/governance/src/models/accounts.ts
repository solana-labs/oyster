import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { utils } from '@oyster/common';

/// Seed  prefix for Governance Program PDAs
export const GOVERNANCE_PROGRAM_SEED = 'governance';

export enum GovernanceAccountType {
  Uninitialized = 0,
  Realm = 1,
  TokenOwnerRecord = 2,
  AccountGovernance = 3,
  ProgramGovernance = 4,
  MintGovernance = 5,
  Proposal = 6,
  SignatoryRecord = 7,
  VoteRecord = 8,
  ProposalInstruction = 9,
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
      ];
    default:
      throw Error(`${accountClass} account is not supported`);
  }
}

export class Realm {
  accountType = GovernanceAccountType.Realm;

  communityMint: PublicKey;

  councilMint: PublicKey | undefined;

  name: string;

  constructor(args: {
    communityMint: PublicKey;
    councilMint: PublicKey | undefined;
    name: string;
  }) {
    this.communityMint = args.communityMint;
    this.councilMint = args.councilMint;
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

  isProgramGovernance() {
    return this.accountType === GovernanceAccountType.ProgramGovernance;
  }

  isMintGovernance() {
    return this.accountType === GovernanceAccountType.MintGovernance;
  }

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

export async function getTokenOwnerAddress(
  realm: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) {
  const PROGRAM_IDS = utils.programIds();

  const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
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

export async function getSignatoryRecordAddress(
  proposal: PublicKey,
  signatory: PublicKey,
) {
  const PROGRAM_IDS = utils.programIds();

  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      signatory.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
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
  holdUpTime: BN;
  instruction: InstructionData;
  executedAt: BN | null;

  constructor(args: {
    proposal: PublicKey;
    holdUpTime: BN;
    instruction: InstructionData;
    executedAt: BN | null;
  }) {
    this.proposal = args.proposal;
    this.holdUpTime = args.holdUpTime;
    this.instruction = args.instruction;
    this.executedAt = args.executedAt;
  }
}
