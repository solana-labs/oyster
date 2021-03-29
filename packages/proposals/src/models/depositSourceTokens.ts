import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as Layout from '../utils/layout';

import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';
import BN from 'bn.js';

/// [Requires tokens of the Governance mint or Council mint depending on type of TimelockSet]
/// Deposits voting tokens to be used during the voting process in a timelock.
/// These tokens are removed from your account and can be returned by withdrawing
/// them from the timelock (but then you will miss the vote.)
///
///   0. `[writable]` Initialized Voting account to hold your received voting tokens.
///   1. `[writable]` User token account to deposit tokens from.
///   2. `[writable]` Source holding account for timelock that will accept the tokens in escrow.
///   3. `[writable]` Voting mint account.
///   4. `[]` Timelock set account.
///   5. `[]` Transfer authority
///   6. `[]` Timelock program mint authority
///   7. `[]` Timelock program account pub key.
///   8. `[]` Token program account.
export const depositSourceTokensInstruction = (
  votingAccount: PublicKey,
  sourceAccount: PublicKey,
  sourceHoldingAccount: PublicKey,
  votingMint: PublicKey,
  timelockSetAccount: PublicKey,
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
      instruction: TimelockInstruction.DepositGovernanceTokens,
      votingTokenAmount: new BN(votingTokenAmount),
    },
    data,
  );

  const keys = [
    { pubkey: votingAccount, isSigner: false, isWritable: true },
    { pubkey: sourceAccount, isSigner: false, isWritable: true },
    { pubkey: sourceHoldingAccount, isSigner: false, isWritable: true },
    { pubkey: votingMint, isSigner: false, isWritable: true },
    { pubkey: timelockSetAccount, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: false, isWritable: false },
    { pubkey: mintAuthority, isSigner: false, isWritable: false },
    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
