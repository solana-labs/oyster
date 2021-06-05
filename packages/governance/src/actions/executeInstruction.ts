import {
  Account,
  Connection,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { AccountMetaData, InstructionData, Proposal } from '../models/accounts';

import { withInsertInstruction } from '../models/withInsertInstruction';
import { withExecuteInstruction } from '../models/withExecuteInstruction';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const executeInstruction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const index = 0;
  const holdUpTime = 10;
  const programId = new PublicKey(
    '4x59EZfiJqQdF4sxuH7ppKcuaHksoQsADrjQ7VUHgdJJ',
  );

  const instructionData = new InstructionData({
    programId: programId,
    accounts: [
      new AccountMetaData({
        pubkey: programId,
        isWritable: true,
        isSigner: false,
      }),
      new AccountMetaData({
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isWritable: false,
        isSigner: false,
      }),
      new AccountMetaData({
        pubkey: new PublicKey('SysvarFees111111111111111111111111111111111'),
        isWritable: false,
        isSigner: false,
      }),
    ],
    data: Uint8Array.from([1, 2, 3]),
  });

  const instructionAddress = new PublicKey(
    '12ubuoZxf8YUirCdfja1whLpeomaKGob67out1gSoGP1',
  );

  await withExecuteInstruction(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    instructionAddress,
    programId,
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
