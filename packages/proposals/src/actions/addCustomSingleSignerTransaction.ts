import {
  Account,
  Connection,
  Message,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, models, ParsedAccount } from '@oyster/common';
import {
  CustomSingleSignerTimelockTransactionLayout,
  TimelockSet,
  TimelockState,
} from '../models/timelock';
import { addCustomSingleSignerTransactionInstruction } from '../models/addCustomSingleSignerTransaction';
import { pingInstruction } from '../models/ping';
import { serializeInstruction } from '../utils/serialize';

const { sendTransaction } = contexts.Connection;
const { notify, shortvec, toUTF8Array, fromUTF8Array } = utils;
const { approve } = models;

export const addCustomSingleSignerTransaction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
  state: ParsedAccount<TimelockState>,
  sigAccount: PublicKey,
  slot: string,
  instruction: string,
  position: number,
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

  const [authority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

  signers.push(txnKey);

  instructions.push(uninitializedTxnInstruction);

  const transferAuthority = approve(
    instructions,
    [],
    sigAccount,
    wallet.publicKey,
    1,
  );
  signers.push(transferAuthority);

  /*instruction = (
    await serializeInstruction({
      connection,
      instr: pingInstruction(),
    })
  ).base64;

  console.log(pingInstruction());
  const asArr = (
    await serializeInstruction({
      connection,
      instr: pingInstruction(),
    })
  ).byteArray;

  console.log(asArr);
  console.log('Message', Message.from(asArr));*/

  instructions.push(
    addCustomSingleSignerTransactionInstruction(
      txnKey.publicKey,
      state.pubkey,
      sigAccount,
      proposal.info.signatoryValidation,
      proposal.pubkey,
      proposal.info.config,
      transferAuthority.publicKey,
      authority,
      slot,
      instruction,
      position,
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
