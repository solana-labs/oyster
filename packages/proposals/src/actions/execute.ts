import {
  Account,
  Connection,
  Message,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { TimelockSet, TimelockTransaction } from '../models/timelock';
import { executeInstruction } from '../models/execute';
import { LABELS } from '../constants';
const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const execute = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  transaction: ParsedAccount<TimelockTransaction>,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const [authority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  const actualMessage = decodeBufferIntoMessage(transaction.info.instruction);
  console.log(actualMessage);
  instructions.push(
    executeInstruction(
      transaction.pubkey,
      proposal.pubkey,
      actualMessage.accountKeys[actualMessage.instructions[0].programIdIndex],
      authority,
    ),
  );

  notify({
    message: LABELS.ADDING_VOTES_TO_VOTER,
    description: LABELS.PLEASE_WAIT,
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
      true,
    );

    notify({
      message: LABELS.VOTES_ADDED,
      type: 'success',
      description: LABELS.TRANSACTION + ` ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

function decodeBufferIntoMessage(instruction: string): Message {
  // stored as a base64, we need to convert back from base64(via atob), then convert that decoded
  // to a utf8 array, then decode that buffer into instruction

  let binaryString = atob(instruction);
  let len = binaryString.length;
  let byteArray = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }
  return Message.from(byteArray);
}
