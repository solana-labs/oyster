import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

/// Seed  prefix for Governance Program PDAs
export const GOVERNANCE_PROGRAM_SEED = 'governance';

export enum GovernanceAccountType {
  Uninitialized = 0,
  Realm = 1,
  AccountGovernance = 3,

  Proposal = 7,
  ProposalState = 4,
  VoteRecord = 5,
  CustomSingleSignerTransaction = 6,
}

export class Realm {
  accountType: GovernanceAccountType;

  communityMint: PublicKey;

  councilMint?: PublicKey | null;

  name: string;

  constructor(args: {
    accountType: number;
    communityMint: PublicKey;
    councilMint?: string;
    name: string;
  }) {
    this.accountType = args.accountType;

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
