import {
  Account,
  Connection,
  Message,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils, ParsedAccount, sendTransactionWithRetry } from '@oyster/common';

import {
  ProposalOld,
  ProposalStateOld,
  GovernanceTransaction,
} from '../models/serialisation';
import { executeInstruction } from '../models/execute';
import { LABELS } from '../constants';
import { getMessageAccountInfos } from '../utils/transactions';
const { notify } = utils;

export const execute = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<ProposalOld> | null,
  state: ParsedAccount<ProposalStateOld>,
  transaction: ParsedAccount<GovernanceTransaction>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
  const actualMessage = decodeBufferIntoMessage(transaction.info.instruction);
  const accountInfos = getMessageAccountInfos(actualMessage);

  instructions.push(
    executeInstruction(
      transaction.pubkey,
      state.pubkey,
      proposal!.pubkey,
      actualMessage.accountKeys[actualMessage.instructions[0].programIdIndex],
      proposal!.info.config,
      accountInfos,
    ),
  );

  notify({
    message: LABELS.EXECUTING,
    description: LABELS.PLEASE_WAIT,
    type: 'warn',
  });

  try {
    let tx = await sendTransactionWithRetry(
      connection,
      wallet,
      instructions,
      signers,
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
