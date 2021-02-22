import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, ParsedAccount } from '@oyster/common';

import {
  CustomSingleSignerTimelockTransactionLayout,
  TimelockSet,
} from '../models/timelock';
import { addCustomSingleSignerTransactionInstruction } from '../models/addCustomSingleSignerTransaction';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const addCustomSingleSignerTransaction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  sigAccount: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const rentExempt = await connection.getMinimumBalanceForRentExemption(
    CustomSingleSignerTimelockTransactionLayout.span,
  );
  const txnKey = new Account();

  const uninitializedTxnInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: txnKey.publicKey,
    lamports: rentExempt,
    space: CustomSingleSignerTimelockTransactionLayout.span,
    programId: PROGRAM_IDS.timelock.programId,
  });

  signers.push(txnKey);

  instructions.push(uninitializedTxnInstruction);

  instructions.push(
    addCustomSingleSignerTransactionInstruction(
      txnKey.publicKey,
      proposal.pubkey,
      sigAccount,
      proposal.info.signatoryValidation,
      '0',
      '12345',
      0,
    ),
  );

  notify({
    message: 'Adding transaction...',
    description: 'Please wait...',
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
      message: 'Transaction added.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
