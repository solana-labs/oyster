import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './instructions';

/// Executes a command in the Proposal
///
///   0. `[writable]` Transaction account you wish to execute.
///   1. `[writable]` Proposal state account.
///   2. `[]` Program being invoked account
///   3. `[]` Proposal account.
///   4. `[]` Governance account
///   5. `[]` Governance program account pub key.
///   6. `[]` Clock sysvar.
///   7+ Any extra accounts that are part of the instruction, in order
export const executeInstruction = (
  transactionAccount: PublicKey,
  proposalStateAccount: PublicKey,
  proposalAccount: PublicKey,
  programBeingInvokedAccount: PublicKey,
  governance: PublicKey,
  accountInfos: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[],
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  console.log('ACCTS', accountInfos);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.Execute,
    },
    data,
  );

  const keys = [
    // just a note this were all set to writable true...come back and check on this
    { pubkey: transactionAccount, isSigner: false, isWritable: true },
    { pubkey: proposalStateAccount, isSigner: false, isWritable: true },
    { pubkey: programBeingInvokedAccount, isSigner: false, isWritable: false },
    { pubkey: proposalAccount, isSigner: false, isWritable: false },
    { pubkey: governance, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ...accountInfos,
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
