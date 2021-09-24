import { sendTransaction, utils } from '@oyster/common';
import {
  Connection,
  Account,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

const { notify } = utils;

export const createAccount = async (
  connection: Connection,
  wallet: any,
  size: number,
  programId: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const account = new Account();

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    size,
  );

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: account.publicKey,
      lamports: mintRentExempt,
      space: size,
      programId: programId,
    }),
  );

  signers.push(account);

  console.log('ACCOUNT:', account.publicKey.toBase58());

  notify({
    message: 'Creating account...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, signers);

    notify({
      message: 'Governance artifacts created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};
