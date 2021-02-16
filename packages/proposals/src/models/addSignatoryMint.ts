import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockConfig, TimelockInstruction } from './timelock';

/// Adds signatory mint to new timelock set. Gives signatory token to admin caller.
///
///   0. `[writable]` Uninitialized Timelock set account
///   1. `[writable]` Initialized Admin Token account
///   2. `[writable]` Initialized Admin mint account
///   3. `[writable]` Uninitialized Signatory Mint account
///   4. `[writable]` Uninitialized Signatory Validation account
///   5. `[writable]` Uninitialized Destination account for first signatory token
///   6. `[]` Timelock Program
///   7. '[]` Token program id
///   8. `[]` Rent sysvar
export const addSignatoryMintInstruction = (
  timelockSetAccount: PublicKey,
  adminAccount: PublicKey,
  adminMintAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  signatoryValidationAccount: PublicKey,
  destinationSignatoryAccount: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: TimelockInstruction.AddSignatoryMint,
    },
    data,
  );

  const keys = [
    { pubkey: timelockSetAccount, isSigner: true, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: true },
    { pubkey: adminMintAccount, isSigner: true, isWritable: true },
    { pubkey: signatoryMintAccount, isSigner: true, isWritable: true },
    { pubkey: signatoryValidationAccount, isSigner: true, isWritable: true },
    { pubkey: destinationSignatoryAccount, isSigner: true, isWritable: true },
    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
