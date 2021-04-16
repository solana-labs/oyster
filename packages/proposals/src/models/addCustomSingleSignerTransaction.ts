import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as Layout from '../utils/layout';

import * as BufferLayout from 'buffer-layout';
import {
  INSTRUCTION_LIMIT,
  TimelockInstruction,
  TRANSACTION_SLOTS,
} from './timelock';
import BN from 'bn.js';

/// [Requires Signatory token]
/// Adds a Transaction to the Timelock Set. Max of 10 of any Transaction type. More than 10 will throw error.
/// Creates a PDA using your authority to be used to later execute the instruction.
/// This transaction needs to contain authority to execute the program.
///
///   0. `[writable]` Uninitialized Timelock Transaction account.
///   1. `[writable]` Timelock set account.
///   2. `[writable]` Signatory account
///   3. `[writable]` Signatory validation account.
///   4. `[]` Timelock Set account.
///   5. `[]` Timelock Config account.
///   6. `[]` Transfer authority
///   7. `[]` Timelock mint authority
///   8. `[]` Token program account.
export const addCustomSingleSignerTransactionInstruction = (
  timelockTransactionAccount: PublicKey,
  timelockStateAccount: PublicKey,
  signatoryAccount: PublicKey,
  signatoryValidationAccount: PublicKey,
  timelockSetAccount: PublicKey,
  timelockConfigAccount: PublicKey,
  transferAuthority: PublicKey,
  authority: PublicKey,
  slot: string,
  instruction: string, // base64 encoded
  position: number,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();
  // need to get a pda, move blockhash out of here...

  let binaryString = atob(instruction);
  let len = binaryString.length;
  let bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const instructionAsBytes = [...bytes];
  if (instructionAsBytes.length > INSTRUCTION_LIMIT) {
    throw new Error(
      'Instruction length in bytes is more than ' + INSTRUCTION_LIMIT,
    );
  }

  if (position > TRANSACTION_SLOTS) {
    throw new Error(
      'Position is more than ' + TRANSACTION_SLOTS + ' which is not allowed.',
    );
  }

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('slot'),
    BufferLayout.seq(BufferLayout.u8(), INSTRUCTION_LIMIT, 'instructions'),
    BufferLayout.u8('position'),
    BufferLayout.u16('instructionEndIndex'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  const instructionEndIndex = instructionAsBytes.length - 1;
  for (let i = instructionAsBytes.length; i <= INSTRUCTION_LIMIT - 1; i++) {
    instructionAsBytes.push(0);
  }

  dataLayout.encode(
    {
      instruction: TimelockInstruction.AddCustomSingleSignerTransaction,
      slot: new BN(slot),
      instructions: instructionAsBytes,
      position: position,
      instructionEndIndex: instructionEndIndex,
    },
    data,
  );

  const keys = [
    { pubkey: timelockTransactionAccount, isSigner: true, isWritable: true },
    { pubkey: timelockStateAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryValidationAccount, isSigner: false, isWritable: true },
    { pubkey: timelockSetAccount, isSigner: false, isWritable: false },
    { pubkey: timelockConfigAccount, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
