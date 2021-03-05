import {
  Account,
  CompiledInstruction,
  Connection,
  Message,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, models, ParsedAccount } from '@oyster/common';
import bs58 from 'bs58';
import {
  CustomSingleSignerTimelockTransactionLayout,
  INSTRUCTION_LIMIT,
  TimelockSet,
} from '../models/timelock';
import { addCustomSingleSignerTransactionInstruction } from '../models/addCustomSingleSignerTransaction';
import { pingInstruction } from '../models/ping';
import * as BufferLayout from 'buffer-layout';
import { signInstruction } from '../models/sign';

const { sendTransaction } = contexts.Connection;
const { notify, shortvec, toUTF8Array, fromUTF8Array } = utils;
const { approve } = models;

export const addCustomSingleSignerTransaction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<TimelockSet>,
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
  instruction = await serializeInstruction2({
    connection,
    wallet,
    instr: pingInstruction(),
  });
  instructions.push(
    addCustomSingleSignerTransactionInstruction(
      txnKey.publicKey,
      proposal.pubkey,
      sigAccount,
      proposal.info.signatoryValidation,
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

async function serializeInstruction2({
  connection,
  wallet,
  instr,
}: {
  connection: Connection;
  wallet: any;
  instr: TransactionInstruction;
}): Promise<string> {
  const PROGRAM_IDS = utils.programIds();
  let instructionTransaction = new Transaction();
  instructionTransaction.add(instr);
  instructionTransaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;
  const [authority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );
  instructionTransaction.setSigners(authority);
  const msg: Message = instructionTransaction.compileMessage();

  console.log('message', msg);
  console.log('from', Message.from(msg.serialize()));
  console.log(
    msg.serialize(),
    toUTF8Array(
      atob(fromUTF8Array(toUTF8Array(msg.serialize().toString('base64')))),
    ),
  );
  let binary_string = atob(msg.serialize().toString('base64'));
  let len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  console.log('from again', Message.from(bytes));
  return msg.serialize().toString('base64');
}

async function serializeInstruction({
  connection,
  wallet,
  instr,
}: {
  connection: Connection;
  wallet: any;
  instr: TransactionInstruction;
}): Promise<string> {
  let instructionTransaction = new Transaction();
  instructionTransaction.add(instr);
  instructionTransaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;
  // We dont actually signed, we just set this to get past a throw condition in compileMessage
  instructionTransaction.setSigners(
    // fee payied by the wallet owner
    wallet.publicKey,
  );
  const msg: Message = instructionTransaction.compileMessage();

  const numKeys = msg.accountKeys.length;

  let keyCount: number[] = [];
  shortvec.encodeLength(keyCount, numKeys);

  const instruction = msg.instructions[0];
  const { accounts, programIdIndex } = instruction;
  const data = bs58.decode(instruction.data);

  let keyIndicesCount: number[] = [];
  shortvec.encodeLength(keyIndicesCount, accounts.length);

  let dataCount: number[] = [];
  shortvec.encodeLength(dataCount, data.length);

  const instructionMeta = {
    programIdIndex,
    keyIndicesCount: Buffer.from(keyIndicesCount),
    keyIndices: Buffer.from(accounts),
    dataLength: Buffer.from(dataCount),
    data,
  };

  let instructionBuffer = Buffer.alloc(100);

  const instructionLayout = BufferLayout.struct([
    BufferLayout.u8('programIdIndex'),

    BufferLayout.blob(
      instructionMeta.keyIndicesCount.length,
      'keyIndicesCount',
    ),
    BufferLayout.seq(
      BufferLayout.u8('keyIndex'),
      instructionMeta.keyIndices.length,
      'keyIndices',
    ),
    BufferLayout.blob(instructionMeta.dataLength.length, 'dataLength'),
    BufferLayout.seq(
      BufferLayout.u8('userdatum'),
      instruction.data.length,
      'data',
    ),
  ]);
  instructionLayout.encode(instructionMeta, instructionBuffer);
  console.log(instruction);
  console.log(instructionBuffer);
  console.log(instructionBuffer.length);

  console.log(instructionBuffer.toString('base64'));
  console.log(instructionBuffer.toString('base64').length);
  console.log(decodeBufferIntoInstruction(instructionBuffer));

  return instructionBuffer.toString('base64');
}

// For testing, eventually can be used agains tbase64 string (turn into bytes) to figure out accounts and
// stuff, maybe display something to user. Decode.
function decodeBufferIntoInstruction(instructionBuffer: Buffer) {
  let byteArray = [...instructionBuffer];
  let decodedInstruction: Partial<CompiledInstruction> = {};
  decodedInstruction.programIdIndex = byteArray.shift();
  const accountCount = shortvec.decodeLength(byteArray);
  decodedInstruction.accounts = byteArray.slice(0, accountCount);
  byteArray = byteArray.slice(accountCount);
  const dataLength = shortvec.decodeLength(byteArray);
  const data = byteArray.slice(0, dataLength);
  decodedInstruction.data = bs58.encode(Buffer.from(data));
  return decodedInstruction;
}
