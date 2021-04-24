import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './timelock';

/// Executes a command in the timelock set.
///
///   0. `[writable]` Transaction account you wish to execute.
///   1. `[writable]` Timelock state account.
///   2. `[]` Program being invoked account
///   3. `[]` Timelock set account.
///   4. `[]` Timelock config
///   5. `[]` Clock sysvar.
///   7+ Any extra accounts that are part of the instruction, in order
export const executeInstruction = (
  transactionAccount: PublicKey,
  timelockStateAccount: PublicKey,
  timelockSetAccount: PublicKey,
  programBeingInvokedAccount: PublicKey,
  timelockConfig: PublicKey,
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
      instruction: GovernanceInstruction.Execute,
      numberOfExtraAccounts: accountInfos.length,
    },
    data,
  );

  const keys = [
    // just a note this were all set to writable true...come back and check on this
    { pubkey: transactionAccount, isSigner: false, isWritable: true },
    { pubkey: timelockStateAccount, isSigner: false, isWritable: true },
    { pubkey: programBeingInvokedAccount, isSigner: false, isWritable: false },
    { pubkey: timelockSetAccount, isSigner: false, isWritable: false },
    { pubkey: timelockConfig, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ...accountInfos,
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
