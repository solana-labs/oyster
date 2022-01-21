import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { Vote, VoteKind } from './instructions';
import { PROGRAM_VERSION_V1, PROGRAM_VERSION_V2 } from '../registry/constants';
import { BorshClass } from '../tools/borsh';

/// Seed  prefix for Governance Program PDAs
export const GOVERNANCE_PROGRAM_SEED = 'governance';

export enum GovernanceAccountType {
  Uninitialized = 0,
  Realm = 1,
  TokenOwnerRecord = 2,
  AccountGovernance = 3,
  ProgramGovernance = 4,
  ProposalV1 = 5,
  SignatoryRecord = 6,
  VoteRecordV1 = 7,
  ProposalInstructionV1 = 8,
  MintGovernance = 9,
  TokenGovernance = 10,
  RealmConfig = 11,
  VoteRecordV2 = 12,
  ProposalInstructionV2 = 13,
  ProposalV2 = 14,
  ProgramMetadata = 14,
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
  | typeof ProposalInstruction
  | typeof RealmConfigAccount
  | typeof ProgramMetadata;

export function getAccountTypes(accountClass: GovernanceAccountClass) {
  switch (accountClass) {
    case Realm:
      return [GovernanceAccountType.Realm];
    case TokenOwnerRecord:
      return [GovernanceAccountType.TokenOwnerRecord];
    case Proposal:
      return [
        GovernanceAccountType.ProposalV1,
        GovernanceAccountType.ProposalV2,
      ];
    case SignatoryRecord:
      return [GovernanceAccountType.SignatoryRecord];
    case VoteRecord:
      return [
        GovernanceAccountType.VoteRecordV1,
        GovernanceAccountType.VoteRecordV2,
      ];
    case ProposalInstruction:
      return [
        GovernanceAccountType.ProposalInstructionV1,
        GovernanceAccountType.ProposalInstructionV2,
      ];
    case RealmConfigAccount:
      return [GovernanceAccountType.RealmConfig];
    case Governance:
      return [
        GovernanceAccountType.AccountGovernance,
        GovernanceAccountType.ProgramGovernance,
        GovernanceAccountType.MintGovernance,
        GovernanceAccountType.TokenGovernance,
      ];
    case ProgramMetadata:
      return [GovernanceAccountType.ProgramMetadata];
    default:
      throw Error(`${accountClass} account is not supported`);
  }
}

export function getAccountProgramVersion(accountType: GovernanceAccountType) {
  switch (accountType) {
    case GovernanceAccountType.VoteRecordV2:
    case GovernanceAccountType.ProposalInstructionV2:
    case GovernanceAccountType.ProposalV2:
      return PROGRAM_VERSION_V2;
    default:
      return PROGRAM_VERSION_V1;
  }
}

export enum VoteThresholdPercentageType {
  YesVote = 0,
  Quorum = 1,
}

interface VoteThresholdPercentageProps {
  value: number;
}
export interface VoteThresholdPercentage extends VoteThresholdPercentageProps {}
export class VoteThresholdPercentage extends BorshClass<VoteThresholdPercentageProps> {
  type = VoteThresholdPercentageType.YesVote;
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

export enum MintMaxVoteWeightSourceType {
  SupplyFraction = 0,
  Absolute = 1,
}

interface MintMaxVoteWeightSourceProps {
  value: BN;
}
export interface MintMaxVoteWeightSource extends MintMaxVoteWeightSourceProps {}
export class MintMaxVoteWeightSource extends BorshClass<MintMaxVoteWeightSourceProps> {
  type = MintMaxVoteWeightSourceType.SupplyFraction;

  static SUPPLY_FRACTION_BASE = new BN(10000000000);
  static SUPPLY_FRACTION_DECIMALS = 10;

  static FULL_SUPPLY_FRACTION = new MintMaxVoteWeightSource({
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

interface VoteTypeProps {
  type: VoteTypeKind;
  choiceCount?: number;
}
export interface VoteType extends VoteTypeProps {}
export class VoteType extends BorshClass<VoteTypeProps> {
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

export interface RealmConfigArgs {
  useCouncilMint: boolean;
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
  minCommunityTokensToCreateGovernance: BN;

  // Versions >= 2
  useCommunityVoterWeightAddin: boolean;
}
export class RealmConfigArgs extends BorshClass<RealmConfigArgs> {}

export interface RealmConfig {
  councilMint?: PublicKey;
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
  minCommunityTokensToCreateGovernance: BN;
  reserved: Uint8Array;
  useCommunityVoterWeightAddin: boolean;
}
export class RealmConfig extends BorshClass<RealmConfig> {}

interface RealmProps {
  communityMint: PublicKey;
  reserved: Uint8Array;
  config: RealmConfig;
  authority?: PublicKey;
  name: string;
}
export interface Realm extends RealmProps {}
export class Realm extends BorshClass<RealmProps> {
  accountType = GovernanceAccountType.Realm;
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

export class RealmConfigAccount {
  accountType = GovernanceAccountType.RealmConfig;

  realm: PublicKey;
  communityVoterWeightAddin?: PublicKey;

  constructor(args: {
    realm: PublicKey;
    communityVoterWeightAddin?: PublicKey;
  }) {
    this.realm = args.realm;
    this.communityVoterWeightAddin = args.communityVoterWeightAddin;
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

interface GovernanceConfigProps {
  voteThresholdPercentage: VoteThresholdPercentage;
  minCommunityTokensToCreateProposal: BN;
  minInstructionHoldUpTime: number;
  maxVotingTime: number;
  voteWeightSource?: VoteWeightSource;
  proposalCoolOffTime?: number;
  minCouncilTokensToCreateProposal: BN;
}
export interface GovernanceConfig extends GovernanceConfigProps {}
export class GovernanceConfig extends BorshClass<GovernanceConfigProps> {
  voteWeightSource = VoteWeightSource.Deposit;
  proposalCoolOffTime = 0;
}

interface GovernanceProps {
  realm: PublicKey;
  governedAccount: PublicKey;
  accountType: number;
  config: GovernanceConfig;
  reserved?: Uint8Array;
  proposalCount: number;
}
export interface Governance extends GovernanceProps {}
export class Governance extends BorshClass<GovernanceProps> {
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

interface TokenOwnerRecordProps {
  realm: PublicKey;
  governingTokenMint: PublicKey;
  governingTokenOwner: PublicKey;
  governingTokenDepositAmount: BN;
  unrelinquishedVotesCount: number;
  totalVotesCount: number;
  outstandingProposalCount: number;
  reserved: Uint8Array;
}
export interface TokenOwnerRecord extends TokenOwnerRecordProps {}
export class TokenOwnerRecord extends BorshClass<TokenOwnerRecordProps> {
  accountType = GovernanceAccountType.TokenOwnerRecord;
  governanceDelegate?: PublicKey;
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
}

export enum OptionVoteResult {
  None,
  Succeeded,
  Defeated,
}

export interface ProposalOption {
  label: string;
  voteWeight: BN;
  voteResult: OptionVoteResult;

  instructionsExecutedCount: number;
  instructionsCount: number;
  instructionsNextIndex: number;
}
export class ProposalOption extends BorshClass<ProposalOption> {}

interface ProposalProps {
  accountType: GovernanceAccountType;
  governance: PublicKey;
  governingTokenMint: PublicKey;
  state: ProposalState;
  tokenOwnerRecord: PublicKey;
  signatoriesCount: number;
  signatoriesSignedOffCount: number;
  draftAt: BN;
  signingOffAt: BN | null;
  votingAt: BN | null;
  votingAtSlot: BN | null;
  votingCompletedAt: BN | null;
  executingAt: BN | null;
  closedAt: BN | null;
  executionFlags: InstructionExecutionFlags;
  maxVoteWeight: BN | null;
  voteThresholdPercentage: VoteThresholdPercentage | null;
  name: string;
  descriptionLink: string;

  // v1
  yesVotesCount: BN;
  noVotesCount: BN;
  instructionsExecutedCount: number;
  instructionsCount: number;
  instructionsNextIndex: number;

  // v2
  voteType: VoteType;
  options: ProposalOption[];
  denyVoteWeight?: BN;
}
export interface Proposal extends ProposalProps {}
export class Proposal extends BorshClass<ProposalProps> {
  /// Returns true if Proposal is in state when no voting can happen any longer
  isVoteFinalized(): boolean {
    switch (this.state) {
      case ProposalState.Succeeded:
      case ProposalState.Executing:
      case ProposalState.Completed:
      case ProposalState.Cancelled:
      case ProposalState.Defeated:
      case ProposalState.ExecutingWithErrors:
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
          governance.config.maxVotingTime -
          unixTimestampInSeconds;
  }

  hasVoteTimeEnded(governance: Governance) {
    return this.getTimeToVoteEnd(governance) <= 0;
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

interface SignatoryRecordProps {
  proposal: PublicKey;
  signatory: PublicKey;
  signedOff: boolean;
}
export interface SignatoryRecord extends SignatoryRecordProps {}
export class SignatoryRecord extends BorshClass<SignatoryRecordProps> {
  accountType: GovernanceAccountType = GovernanceAccountType.SignatoryRecord;
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

export interface VoteWeight {
  yes: BN;
  no: BN;
}
export class VoteWeight extends BorshClass<VoteWeight> {}

interface VoteRecordProps {
  accountType: GovernanceAccountType;
  proposal: PublicKey;
  governingTokenOwner: PublicKey;
  isRelinquished: boolean;
  // V1
  voteWeight?: VoteWeight;
  // V2 -------------------------------
  voterWeight?: BN;
  vote?: Vote;
  // -------------------------------
}
export interface VoteRecord extends VoteRecordProps {}
export class VoteRecord extends BorshClass<VoteRecordProps> {
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

export interface AccountMetaData {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}
export class AccountMetaData extends BorshClass<AccountMetaData> {}

export interface InstructionData {
  programId: PublicKey;
  accounts: AccountMetaData[];
  data: Uint8Array;
}
export class InstructionData extends BorshClass<InstructionData> {}

interface ProposalInstructionProps {
  proposal: PublicKey;
  instructionIndex: number;
  // V2
  optionIndex: number;

  holdUpTime: number;
  instruction: InstructionData;
  executedAt: BN | null;
  executionStatus: InstructionExecutionStatus;
}
export interface ProposalInstruction extends ProposalInstructionProps {}
export class ProposalInstruction extends BorshClass<ProposalInstructionProps> {
  accountType = GovernanceAccountType.ProposalInstructionV1;
}

export async function getProposalInstructionAddress(
  programId: PublicKey,
  programVersion: number,
  proposal: PublicKey,
  optionIndex: number,
  instructionIndex: number,
) {
  let optionIndexBuffer = Buffer.alloc(2);
  optionIndexBuffer.writeInt16LE(optionIndex, 0);

  let instructionIndexBuffer = Buffer.alloc(2);
  instructionIndexBuffer.writeInt16LE(instructionIndex, 0);

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

interface ProgramMetadataProps {
  updatedAt: BN;
  version: string;
  reserved: Uint8Array;
}
export interface ProgramMetadata extends ProgramMetadataProps {}
export class ProgramMetadata extends BorshClass<ProgramMetadataProps> {
  accountType = GovernanceAccountType.ProgramMetadata;
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
