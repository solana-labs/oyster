import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';
import { LendingInstruction } from './instruction';

/// Initializes a new lending market.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Lending market account - uninitialized.
///   1. `[]` Quote currency SPL Token mint.
///   2. `[]` Rent sysvar.
///   3. `[]` Token program id.
// InitLendingMarket {
//   /// Owner authority which can add new reserves
//   owner: Pubkey,
// },
export const initLendingMarketInstruction = (
  owner: PublicKey,
  lendingMarket: PublicKey,
  quoteTokenMint: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.publicKey('owner'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.InitLendingMarket,
      owner,
    },
    data,
  );

  const keys = [
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: quoteTokenMint, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
