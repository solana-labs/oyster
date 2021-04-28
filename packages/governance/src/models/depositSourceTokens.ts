import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as Layout from '../utils/layout';

import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './governance';
import BN from 'bn.js';

/// [Requires tokens of the Governance mint or Council mint depending on type of Proposal]
/// Deposits voting tokens to be used during the voting process in a Proposal.
/// These tokens are removed from your account and can be returned by withdrawing
/// them from the Proposal (but then you will miss the vote.)
///
///   0. `[writable]` Governance voting record account. See Vote docs for more detail.
///   1. `[writable]` Initialized Voting account to hold your received voting tokens.
///   2. `[writable]` User token account to deposit tokens from.
///   3. `[writable]` Source holding account for Proposal that will accept the tokens in escrow.
///   4. `[writable]` Voting mint account.
///   5. `[]` Proposal account.
///   6. `[]` Transfer authority
///   7. `[]` Governance program mint authority (pda with seed of Proposal key)
///   8. `[]` Token program account.
export const depositSourceTokensInstruction = (
  governanceVotingRecord: PublicKey,
  votingAccount: PublicKey,
  sourceAccount: PublicKey,
  sourceHoldingAccount: PublicKey,
  votingMint: PublicKey,
  proposalAccount: PublicKey,
  transferAuthority: PublicKey,
  mintAuthority: PublicKey,
  votingTokenAmount: number,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('votingTokenAmount'),
  ]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.DepositGovernanceTokens,
      votingTokenAmount: new BN(votingTokenAmount),
    },
    data,
  );

  const keys = [
    { pubkey: governanceVotingRecord, isSigner: false, isWritable: true },
    { pubkey: votingAccount, isSigner: false, isWritable: true },
    { pubkey: sourceAccount, isSigner: false, isWritable: true },
    { pubkey: sourceHoldingAccount, isSigner: false, isWritable: true },
    { pubkey: votingMint, isSigner: false, isWritable: true },
    { pubkey: proposalAccount, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: mintAuthority, isSigner: false, isWritable: false },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
