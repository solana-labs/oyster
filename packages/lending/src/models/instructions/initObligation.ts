import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
import { LendingInstruction } from './instruction';

/// Initializes a new lending market obligation.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Obligation account - uninitialized.
///   1. `[]` Lending market account.
///   2. `[signer]` Obligation owner.
///   3. `[]` Clock sysvar.
///   4. `[]` Rent sysvar.
///   5. `[]` Token program id.
export const initObligationInstruction = (
  obligation: PublicKey,
  lendingMarket: PublicKey,
  obligationOwner: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: LendingInstruction.InitObligation }, data);

  const keys = [
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: obligationOwner, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
