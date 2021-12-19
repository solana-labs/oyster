import { PublicKey } from '@solana/web3.js';
import BN from 'borsh/node_modules/@types/bn.js';

import {
  RealmConfigArgs,
  GovernanceConfig,
  InstructionData,
  VoteType,
} from './accounts';

export enum GovernanceInstruction {
  CreateRealm = 0,
  DepositGoverningTokens = 1,
  WithdrawGoverningTokens = 2,
  SetGovernanceDelegate = 3, // --
  CreateAccountGovernance = 4,
  CreateProgramGovernance = 5,

  CreateProposal = 6,
  AddSignatory = 7,
  RemoveSignatory = 8,

  InsertInstruction = 9,
  RemoveInstruction = 10,
  CancelProposal = 11,
  SignOffProposal = 12,
  CastVote = 13,
  FinalizeVote = 14,
  RelinquishVote = 15,
  ExecuteInstruction = 16,

  CreateMintGovernance = 17,
  CreateTokenGovernance = 18,
  SetGovernanceConfig = 19,
  FlagInstructionError = 20,
  SetRealmAuthority = 21,
  SetRealmConfig = 22,
}

export class CreateRealmArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CreateRealm;
  configArgs: RealmConfigArgs;
  name: string;

  constructor(args: { name: string; configArgs: RealmConfigArgs }) {
    this.name = args.name;
    this.configArgs = args.configArgs;
  }
}

export class DepositGoverningTokensArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.DepositGoverningTokens;
  amount: BN;

  constructor(args: { amount: BN }) {
    this.amount = args.amount;
  }
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

export class CreateMintGovernanceArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.CreateMintGovernance;
  config: GovernanceConfig;
  transferMintAuthority: boolean;

  constructor(args: {
    config: GovernanceConfig;
    transferMintAuthority: boolean;
  }) {
    this.config = args.config;
    this.transferMintAuthority = !!args.transferMintAuthority;
  }
}

export class CreateTokenGovernanceArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.CreateTokenGovernance;
  config: GovernanceConfig;
  transferTokenOwner: boolean;

  constructor(args: { config: GovernanceConfig; transferTokenOwner: boolean }) {
    this.config = args.config;
    this.transferTokenOwner = !!args.transferTokenOwner;
  }
}

export class SetGovernanceConfigArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.SetGovernanceConfig;
  config: GovernanceConfig;

  constructor(args: { config: GovernanceConfig }) {
    this.config = args.config;
  }
}

export class CreateProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CreateProposal;
  name: string;
  descriptionLink: string;

  // V1 -----------------------------
  governingTokenMint: PublicKey;
  // --------------------------------

  // V2 -----------------------------
  voteType: VoteType;
  options: string[];
  useDenyOption: boolean;
  // --------------------------------

  constructor(args: {
    name: string;
    descriptionLink: string;
    governingTokenMint: PublicKey;
    voteType: VoteType;
    options: string[];
    useDenyOption: boolean;
  }) {
    this.name = args.name;
    this.descriptionLink = args.descriptionLink;
    this.governingTokenMint = args.governingTokenMint;
    this.voteType = args.voteType;
    this.options = args.options;
    this.useDenyOption = args.useDenyOption;
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

export class CancelProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CancelProposal;
}

export enum YesNoVote {
  Yes,
  No,
}

export class VoteChoice {
  rank: number;
  weightPercentage: number;

  constructor(args: { rank: number; weightPercentage: number }) {
    this.rank = args.rank;
    this.weightPercentage = args.weightPercentage;
  }
}

export enum VoteKind {
  Approve,
  Deny,
}

export class Vote {
  voteType: VoteKind;
  approveChoices: VoteChoice[] | undefined;
  deny: boolean | undefined;

  constructor(args: {
    voteType: VoteKind;
    approveChoices: VoteChoice[] | undefined;
    deny: boolean | undefined;
  }) {
    this.voteType = args.voteType;
    this.approveChoices = args.approveChoices;
    this.deny = args.deny;
  }

  toYesNoVote() {
    switch (this.voteType) {
      case VoteKind.Deny: {
        return YesNoVote.No;
      }
      case VoteKind.Approve: {
        return YesNoVote.Yes;
      }
    }
  }

  static fromYesNoVote(yesNoVote: YesNoVote) {
    switch (yesNoVote) {
      case YesNoVote.Yes: {
        return new Vote({
          voteType: VoteKind.Approve,
          approveChoices: [new VoteChoice({ rank: 0, weightPercentage: 100 })],
          deny: undefined,
        });
      }
      case YesNoVote.No: {
        return new Vote({
          voteType: VoteKind.Deny,
          approveChoices: undefined,
          deny: true,
        });
      }
    }
  }
}

export class CastVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CastVote;

  // V1
  yesNoVote: YesNoVote | undefined;

  // V2
  vote: Vote | undefined;

  constructor(args: {
    yesNoVote: YesNoVote | undefined;
    vote: Vote | undefined;
  }) {
    this.yesNoVote = args.yesNoVote;
    this.vote = args.vote;
  }
}

export class RelinquishVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.RelinquishVote;
}

export class FinalizeVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.FinalizeVote;
}

export class InsertInstructionArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.InsertInstruction;
  index: number;
  optionIndex: number;
  holdUpTime: number;
  instructionData: InstructionData;

  constructor(args: {
    index: number;
    optionIndex: number;
    holdUpTime: number;
    instructionData: InstructionData;
  }) {
    this.index = args.index;
    this.optionIndex = args.optionIndex;
    this.holdUpTime = args.holdUpTime;
    this.instructionData = args.instructionData;
  }
}

export class RemoveInstructionArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.RemoveInstruction;
}

export class ExecuteInstructionArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.ExecuteInstruction;
}

export class FlagInstructionErrorArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.FlagInstructionError;
}

export class SetRealmAuthorityArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.SetRealmAuthority;
  newRealmAuthority: PublicKey;

  constructor(args: { newRealmAuthority: PublicKey }) {
    this.newRealmAuthority = args.newRealmAuthority;
  }
}

export class SetRealmConfigArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.SetRealmConfig;
  configArgs: RealmConfigArgs;

  constructor(args: { configArgs: RealmConfigArgs }) {
    this.configArgs = args.configArgs;
  }
}
