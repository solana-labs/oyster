import { PublicKey } from '@solana/web3.js';

import { GovernanceConfig } from './accounts';

export enum GovernanceInstruction {
  CreateRealm = 0, // done
  DepositGoverningTokens = 1, // done
  WithdrawGoverningTokens = 2, // done
  SetGovernanceDelegate = 3, // --
  CreateAccountGovernance = 4, // done
  CreateProgramGovernance = 5, // done
  CreateProposal = 6, // done
  AddSignatory = 7, // done
  RemoveSignatory = 8, // --

  InsertInstruction = 9,
  RemoveInstruction = 10,
  CancelProposal = 11, // *
  SignOffProposal = 12, // done
  CastVote = 13, // done
  FinalizeVote = 14, // *
  RelinquishVote = 15, // +/- done
  ExecuteInstruction = 16,

  // --- OLD ----

  InitProposal = 17,
  AddSigner = 18,
  RemoveSigner = 19,
  AddCustomSingleSignerTransaction = 20,
  Sign = 21,
  Vote = 22,
  CreateGovernance = 23,
  Execute = 24,
  DepositGovernanceTokens = 25,
  WithdrawVotingTokens = 26,
  CreateGovernanceVotingRecord = 27,
}

export class CreateRealmArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CreateRealm;
  name: string;

  constructor(args: { name: string }) {
    this.name = args.name;
  }
}

export class DepositGoverningTokensArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.DepositGoverningTokens;
}

export class WithdrawGoverningTokensArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.WithdrawGoverningTokens;
}

export class CreateAccountGovernanceArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.CreateAccountGovernance;
  config: GovernanceConfig;

  constructor(args: { config: GovernanceConfig }) {
    this.config = args.config;
  }
}

export class CreateProgramGovernanceArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.CreateProgramGovernance;
  config: GovernanceConfig;
  transferUpgradeAuthority: boolean;

  constructor(args: {
    config: GovernanceConfig;
    transferUpgradeAuthority: boolean;
  }) {
    this.config = args.config;
    this.transferUpgradeAuthority = !!args.transferUpgradeAuthority;
  }
}

export class CreateProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CreateProposal;
  name: string;
  descriptionLink: string;
  governingTokenMint: PublicKey;

  constructor(args: {
    name: string;
    descriptionLink: string;
    governingTokenMint: PublicKey;
  }) {
    this.name = args.name;
    this.descriptionLink = args.descriptionLink;
    this.governingTokenMint = args.governingTokenMint;
  }
}

export class AddSignatoryArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.AddSignatory;
  signatory: PublicKey;

  constructor(args: { signatory: PublicKey }) {
    this.signatory = args.signatory;
  }
}

export class SignOffProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.SignOffProposal;
}

export enum Vote {
  Yes,
  No,
}

export class CastVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CastVote;
  vote: Vote;

  constructor(args: { vote: Vote }) {
    this.vote = args.vote;
  }
}

export class RelinquishVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.RelinquishVote;
}
