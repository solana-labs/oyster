import { SendTransactionError } from '../tools/sdk/runtime';

export const GovernanceError = [
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
  'Invalid Proposal for ProposalTransaction', // InvalidProposalForProposalTransaction
  'Invalid Signatory account address', // InvalidSignatoryAddress
  'Signatory already signed off', // SignatoryAlreadySignedOff
  'Signatory must sign', // SignatoryMustSign
  'Invalid Proposal Owner', //InvalidProposalOwnerAccount
  'Invalid Proposal for VoterRecord', // InvalidProposalForVoterRecord
  'Invalid GoverningTokenOwner for VoteRecord', // InvalidGoverningTokenOwnerForVoteRecord
  'Invalid Governance config: Vote threshold percentage out of range', // InvalidVoteThresholdPercentage
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
  'Proposal does not belong to the given Governance', // InvalidGovernanceForProposal
  'Proposal does not belong to given Governing Mint', // InvalidGoverningMintForProposal
  'Current mint authority must sign transaction', // MintAuthorityMustSign
  'Invalid mint authority', // InvalidMintAuthority
  'Mint has no authority', // MintHasNoAuthority
  'Invalid Token account owner', // SplTokenAccountWithInvalidOwner
  'Invalid Mint account owner', // SplTokenMintWithInvalidOwner
  'Token Account is not initialized', // SplTokenAccountNotInitialized
  "Token Account doesn't exist", // SplTokenAccountDoesNotExist
  'Token account data is invalid', // SplTokenInvalidTokenAccountData
  'Token mint account data is invalid', // SplTokenInvalidMintAccountData
  'Token Mint account is not initialized', // SplTokenMintNotInitialized
  "Token Mint account doesn't exist", // SplTokenMintDoesNotExist
  'Invalid ProgramData account address', // InvalidProgramDataAccountAddress
  'Invalid ProgramData account Data', // InvalidProgramDataAccountData
  "Provided upgrade authority doesn't match current program upgrade authority", // InvalidUpgradeAuthority
  'Current program upgrade authority must sign transaction', // UpgradeAuthorityMustSign
  'Given program is not upgradable', //ProgramNotUpgradable
  'Invalid token owner', //InvalidTokenOwner
  'Current token owner must sign transaction', // TokenOwnerMustSign
  'Given VoteThresholdType is not supported', //VoteThresholdTypeNotSupported
  'Given VoteWeightSource is not supported', //VoteWeightSourceNotSupported
  'GoverningTokenMint not allowed to vote', // GoverningTokenMintNotAllowedToVote
  'Governance PDA must sign', // GovernancePdaMustSign
  'Instruction already flagged with error', // InstructionAlreadyFlaggedWithError
  'Invalid Realm for Governance', // InvalidRealmForGovernance
  'Invalid Authority for Realm', // InvalidAuthorityForRealm
  'Realm has no authority', // RealmHasNoAuthority
  'Realm authority must sign', // RealmAuthorityMustSign
  'Invalid governing token holding account', // InvalidGoverningTokenHoldingAccount
  'Realm council mint change is not supported', // RealmCouncilMintChangeIsNotSupported
  'Not supported mint max vote weight source', // MintMaxVoteWeightSourceNotSupported
  'Invalid max vote weight supply fraction', // InvalidMaxVoteWeightSupplyFraction
  "Owner doesn't have enough governing tokens to create Governance", // NotEnoughTokensToCreateGovernance
  'Too many outstanding proposals', // TooManyOutstandingProposals
  'All proposals must be finalized to withdraw governing tokens', // AllProposalsMustBeFinalisedToWithdrawGoverningTokens
  'Invalid VoterWeightRecord for Realm', // InvalidVoterWeightRecordForRealm
  'Invalid VoterWeightRecord for GoverningTokenMint', // InvalidVoterWeightRecordForGoverningTokenMint
  'Invalid VoterWeightRecord for TokenOwner', // InvalidVoterWeightRecordForTokenOwner
  'VoterWeightRecord expired', // VoterWeightRecordExpired
  'Invalid RealmConfig for Realm', // InvalidRealmConfigForRealm
  'TokenOwnerRecord already exists', // TokenOwnerRecordAlreadyExists
  'Governing token deposits not allowed', // GoverningTokenDepositsNotAllowed
  'Invalid vote choice weight percentage', // InvalidVoteChoiceWeightPercentage
  'Vote type not supported', // VoteTypeNotSupported
  'Invalid proposal options', // InvalidProposalOptions
  'Proposal is not not executable', // ProposalIsNotExecutable
  'Invalid vote', // InvalidVote
  'Cannot execute defeated option', // CannotExecuteDefeatedOption

  'VoterWeightRecord invalid action', // VoterWeightRecordInvalidAction
  'VoterWeightRecord invalid action target', // VoterWeightRecordInvalidActionTarget
  'Invalid MaxVoterWeightRecord for Realm', // InvalidMaxVoterWeightRecordForRealm
  'MaxVoterWeightRecord expired', // InvalidMaxVoterWeightRecordForGoverningTokenMint
  'Cannot execute defeated option', // MaxVoterWeightRecordExpired
  'Not supported VoteType', // NotSupportedVoteType
  'RealmConfig change not allowed', // RealmConfigChangeNotAllowed
  'At least one VoteThreshold is required', // AtLeastOneVoteThresholdRequired
  'Reserved buffer must be empty', // ReservedBufferMustBeEmpty

  'Cannot Relinquish in Finalizing state', // CannotRelinquishInFinalizingState

  'Invalid RealmConfig account address', // InvalidRealmConfigAddress
  'Cannot deposit dormant tokens', // CannotDepositDormantTokens
  'Cannot withdraw membership tokens', // CannotWithdrawMembershipTokens
  'Cannot revoke GoverningTokens', // CannotRevokeGoverningTokens
  'Invalid Revoke amount', // InvalidRevokeAmount
  'Invalid GoverningToken source', // InvalidGoverningTokenSource
  'Cannot change community TokenType to Memebership', // CannotChangeCommunityTokenTypeToMemebership
] as const;

export const TokenError = [
  'Lamport balance below rent-exempt threshold', // NotRentExempt
  'Insufficient funds', // InsufficientFunds
  'Invalid Mint', // InvalidMint
  'Account not associated with this Mint', // MintMismatch,
  'Owner does not match', //  OwnerMismatch,
  'Fixed supply', //  FixedSupply,
  'Already in use', //   AlreadyInUse,
  'Invalid number of provided signers', //  InvalidNumberOfProvidedSigners,
  'Invalid number of required signers', //  InvalidNumberOfRequiredSigners,
  'State is uninitialized', //  UninitializedState,
  'Instruction does not support native tokens', // NativeNotSupported,
  'Non-native account can only be closed if its balance is zero', //  NonNativeHasBalance,
  'Invalid instruction', //  InvalidInstruction,
  'State is invalid for requested operation', //  InvalidState,
  'Operation overflowed', //  Overflow,
  'Account does not support specified authority type', //  AuthorityTypeNotSupported,
  'This token mint cannot freeze accounts', //  MintCannotFreeze,
  'Account is frozen', //  AccountFrozen,
  'The provided decimals value different from the Mint decimals', //  MintDecimalsMismatch,
] as const;

export const GovernanceToolsError = [
  'Account already initialized', // AccountAlreadyInitialized
  "Account doesn't exist", // AccountDoesNotExist
  'Invalid account owner', // InvalidAccountOwner
  'Invalid Account type', // InvalidAccountType
] as const;

const governanceErrorOffset = 500;
const governanceToolsErrorOffset = 1100;

export function getTransactionErrorMsg(error: SendTransactionError) {
  try {
    const instructionError = (error.txError as any).InstructionError[1];

    if (instructionError.Custom !== undefined) {
      if (instructionError.Custom >= governanceToolsErrorOffset) {
        return GovernanceToolsError[
          instructionError.Custom - governanceToolsErrorOffset
        ];
      } else if (instructionError.Custom >= governanceErrorOffset) {
        return GovernanceError[instructionError.Custom - governanceErrorOffset];
      } else {
        // If the error is not from the Governance error space then it's ambiguous because the custom errors share the same space
        // And we can only use some heuristics here to guess what program returned the error
        // For now the most common scenario is an error returned from the token program so I'm mapping the custom errors to it with the 'possible' warning
        return `Possible error: ${TokenError[instructionError.Custom]}`;
      }
    } else {
      return instructionError;
    }
  } catch {
    return JSON.stringify(error);
  }
}
