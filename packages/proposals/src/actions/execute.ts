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
  const actualMessage = decodeBufferIntoMessage(transaction.info.instruction);
  const accountInfos = getAccountInfos(actualMessage);

  instructions.push(
    executeInstruction(
      transaction.pubkey,
      proposal.pubkey,
      actualMessage.accountKeys[actualMessage.instructions[0].programIdIndex],
      proposal.info.config,
      accountInfos,
    ),
  );

  notify({
    message: LABELS.EXECUTING,
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
      message: LABELS.EXECUTED,
      type: 'success',
      description: LABELS.TRANSACTION + ` ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};

function decodeBufferIntoMessage(instruction: number[]): Message {
  return Message.from(instruction);
}

function getAccountInfos(
  actualMessage: Message,
): { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] {
  console.log(actualMessage);
  // From Solana docs:
  /*
  
    The addresses that require signatures appear at the beginning of the account address array, 
    with addresses requesting write access first and read-only accounts following. 
    The addresses that do not require signatures follow the addresses that do, 
    again with read-write accounts first and read-only accounts following.
  */
  const accountInfosInOrder = actualMessage.instructions[0].accounts.map(
    a => actualMessage.accountKeys[a],
  );
  const requireSigsOnlyNotWritable =
    actualMessage.header.numReadonlySignedAccounts;
  const requireNietherSigsNorWrite =
    actualMessage.header.numReadonlyUnsignedAccounts;
  const writableOnly =
    accountInfosInOrder.length -
    requireSigsOnlyNotWritable -
    requireNietherSigsNorWrite;
  const readOnly = requireSigsOnlyNotWritable + requireNietherSigsNorWrite;

  let position = 0;

  let finalArray: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [];
  for (let i = 0; i < writableOnly; i++) {
    finalArray.push({
      pubkey: accountInfosInOrder[position],
      isWritable: true,
      isSigner: false, // We force signer to false because you realistically as executor wont
      // have any of these keys present unless it happens to be your own
      // WE dont care about required signers or not
    });
    position++;
  }

  for (let i = 0; i < readOnly; i++) {
    finalArray.push({
      pubkey: accountInfosInOrder[position],
      isWritable: false,
      isSigner: false,
    });
    position++;
  }

  for (; position < accountInfosInOrder.length; position++) {
    finalArray.push({
      pubkey: accountInfosInOrder[position],
      isWritable: false,
      isSigner: false,
    });
  }
  return finalArray;
}
