import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  contexts,
  utils,
  ParsedAccount,
  deserializeBorsh,
} from '@oyster/common';

import { InstructionData, Proposal } from '../models/accounts';

import { withInsertInstruction } from '../models/withInsertInstruction';
import { GOVERNANCE_SCHEMA } from '../models/serialisation';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const insertInstruction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  index: number,
  holdUpTime: number,
  instructionDataBase64: string,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const governanceAuthority = wallet.publicKey;
  const payer = wallet.publicKey;

  const instructionDataBin = Buffer.from(instructionDataBase64, 'base64');
  const instructionData: InstructionData = deserializeBorsh(
    GOVERNANCE_SCHEMA,
    InstructionData,
    instructionDataBin,
  );

  await withInsertInstruction(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    tokeOwnerRecord,
    governanceAuthority,
    index,
    holdUpTime,
    instructionData,
    payer,
  );

  notify({
    message: 'Adding instruction...',
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
      message: 'Instruction added.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
