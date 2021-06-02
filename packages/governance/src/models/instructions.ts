export enum GovernanceInstruction {
  CreateRealm = 0,
  DepositGoverningTokens = 1,
  WithdrawGoverningTokens = 2,
  CreateAccountGovernance = 4,

  InitProposal = 1,
  AddSigner = 2,
  RemoveSigner = 3,
  AddCustomSingleSignerTransaction = 15,
  Sign = 8,
  Vote = 9,
  CreateGovernance = 10,
  Execute = 11,
  DepositGovernanceTokens = 12,
  WithdrawVotingTokens = 13,
  CreateGovernanceVotingRecord = 14,
}

export class WithdrawGoverningTokensArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.WithdrawGoverningTokens;
}
