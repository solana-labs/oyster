import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockConfig, TimelockInstruction } from './timelock';
import BN from 'bn.js';

/// Adds voting mint to new timelock set.
///
///   0. `[writable]` Uninitialized Timelock set account
///   1. `[writable]` Initialized Admin Token account
///   2. `[writable]` Initialized Admin mint account
///   3. `[writable]` Uninitialized Voting Mint account
///   4. `[writable]` Uninitialized Voting Validation account
///   5. `[]` Timelock Program
///   6. '[]` Token program id
///   7. `[]` Rent sysvar
export const addVotingMintInstruction = (
  timelockSetAccount: PublicKey,
  adminAccount: PublicKey,
  adminMintAccount: PublicKey,
  votingMintAccount: PublicKey,
  votingValidationAccount: PublicKey,
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
    { pubkey: votingMintAccount, isSigner: true, isWritable: true },
    { pubkey: votingValidationAccount, isSigner: true, isWritable: true },
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
