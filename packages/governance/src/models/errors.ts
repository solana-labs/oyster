import { SendTransactionError } from '@oyster/common';

export const GovernanceError: Record<number, string> = [
  'Invalid instruction passed to program', // InvalidInstruction
  'Realm with the given name and governing mints already exists', // RealmAlreadyExists
  'Invalid realm', // InvalidRealm
  'Invalid Governing Token Mint', // InvalidGoverningTokenMint
  'Governing Token Owner must sign transaction', // GoverningTokenOwnerMustSign
  'Governing Token Owner or Delegate  must sign transaction', // GoverningTokenOwnerOrDelegateMustSign
  'All votes must be relinquished to withdraw governing tokens', // AllVotesMustBeRelinquishedToWithdrawGoverningTokens
  'Invalid Token Owner Record account address', // InvalidTokenOwnerRecordAccountAddress
  'Invalid GoverningMint for TokenOwnerRecord', // InvalidGoverningMintForTokenOwnerRecord
  'Invalid Realm for TokenOwnerRecord', // InvalidRealmForTokenOwnerRecord
  'Invalid Proposal for ProposalInstruction', // InvalidProposalForProposalInstruction
  'Invalid Signatory account address', // InvalidSignatoryAddress
  'Signatory already signed off', // SignatoryAlreadySignedOff
  'Signatory must sign', // SignatoryMustSign
  'Invalid Proposal Owner', //InvalidProposalOwnerAccount
  'Invalid Proposal for VoterRecord', // InvalidProposalForVoterRecord
  'Invalid GoverningTokenOwner for VoteRecord', // InvalidGoverningTokenOwnerForVoteRecord
  'Invalid Governance config', // InvalidGovernanceConfig
  'Proposal for the given Governance, Governing Token Mint and index already exists', // ProposalAlreadyExists
  'Token Owner already voted on the Proposal', // VoteAlreadyExists
  "Owner doesn't have enough governing tokens to create Proposal", // NotEnoughTokensToCreateProposal
  "Invalid State: Can't edit Signatories", // InvalidStateCannotEditSignatories
  'Invalid Proposal state', // InvalidProposalState
  "Invalid State: Can't edit instructions", // InvalidStateCannotEditInstructions
  "Invalid State: Can't execute instruction", // InvalidStateCannotExecuteInstruction
  "Can't execute instruction within its hold up time", // CannotExecuteInstructionWithinHoldUpTime
  'Instruction already executed', // InstructionAlreadyExecuted
  'Invalid Instruction index', // InvalidInstructionIndex
  'Instruction hold up time is below the min specified by Governance', // InstructionHoldUpTimeBelowRequiredMin
  'Instruction at the given index for the Proposal already exists', // InstructionAlreadyExists
  "Invalid State: Can't sign off", // InvalidStateCannotSignOff
  "Invalid State: Can't vote", // InvalidStateCannotVote
  "Invalid State: Can't finalize vote", // InvalidStateCannotFinalize
  "Invalid State: Can't cancel Proposal", // InvalidStateCannotCancelProposal
  'Vote already relinquished', // VoteAlreadyRelinquished
  "Can't finalize vote. Voting still in progress", // CannotFinalizeVotingInProgress
  'Proposal voting time expired', // ProposalVotingTimeExpired
  'Invalid Signatory Mint', // InvalidSignatoryMint
  'Invalid account owner', // InvalidAccountOwner
  'Invalid Account type', // InvalidAccountType
  'Proposal does not belong to the given Governance', // InvalidGovernanceForProposal
  'Proposal does not belong to given Governing Mint', // InvalidGoverningMintForProposal
  'Invalid Token account owner', // SplTokenAccountWithInvalidOwner
  'Invalid Mint account owner', // SplTokenMintWithInvalidOwner
  'Token Account is not initialized', // SplTokenAccountNotInitialized
  'Token account data is invalid', // SplTokenInvalidTokenAccountData
  'Token mint account data is invalid', // SplTokenInvalidMintAccountData
  'Token Mint account is not initialized', // SplTokenMintNotInitialized
  'Invalid ProgramData account address', // InvalidProgramDataAccountAddress
  'Invalid ProgramData account Data', // InvalidProgramDataAccountData
  "Provided upgrade authority doesn't match current program upgrade authority", // InvalidUpgradeAuthority
  'Current program upgrade authority must sign transaction', // UpgradeAuthorityMustSign
  'Given program is not upgradable', //ProgramNotUpgradable
];

export function getTransactionErrorMsg(error: SendTransactionError) {
  try {
    const instructionError = (error.txError as any).InstructionError[1];

    return (
      (instructionError.Custom !== undefined
        ? GovernanceError[instructionError.Custom]
        : instructionError) ?? ''
    );
  } catch {
    return JSON.stringify(error);
  }
}
