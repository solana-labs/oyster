import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';

/// Executes a command in the timelock set.
///
///   0. `[writable]` Transaction account you wish to execute.
///   1. `[]` Timelock set account.
///   2. `[]` Program being invoked account
///   3. `[]` Timelock program authority
///   4. `[]` Timelock program account pub key.
export const executeInstruction = (
  transactionAccount: PublicKey,
  timelockSetAccount: PublicKey,
  programBeingInvokedAccount: PublicKey,
  timelockAuthority: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.Execute,
    },
    data,
  );

  const keys = [
    { pubkey: transactionAccount, isSigner: false, isWritable: true },
    { pubkey: timelockSetAccount, isSigner: false, isWritable: true },
    { pubkey: programBeingInvokedAccount, isSigner: false, isWritable: true },
    { pubkey: timelockAuthority, isSigner: false, isWritable: true },
    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
