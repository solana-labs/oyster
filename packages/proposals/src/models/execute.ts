import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
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
///   5. `[]` Clock sysvar.
///   6+ Any extra accounts that are part of the instruction, in order
export const executeInstruction = (
  transactionAccount: PublicKey,
  timelockSetAccount: PublicKey,
  programBeingInvokedAccount: PublicKey,
  timelockAuthority: PublicKey,
  accountInfos: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[],
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.u8('numberOfExtraAccounts'),
  ]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.Execute,
      numberOfExtraAccounts: accountInfos.length,
    },
    data,
  );
  console.log(
    'Acohjnt',
    accountInfos.map(a => console.log(a.pubkey.toBase58(), a.isWritable)),
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
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ...accountInfos,
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
