import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';
import { withWithdrawGoverningTokens } from '../models/withWithdrawGoverningTokens';

const { notify } = utils;

export const withdrawGoverningTokens = async (
  connection: Connection,
  realm: PublicKey,
  governingTokenDestination: PublicKey,
  governingTokenMint: PublicKey,
  wallet: any,
) => {
  let instructions: TransactionInstruction[] = [];

  await withWithdrawGoverningTokens(
    instructions,
    realm,
    governingTokenDestination,
    governingTokenMint,
    wallet.publicKey,
  );

  notify({
    message: 'Depositing governing tokens...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, []);

    notify({
      message: 'Tokens have been deposited.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
