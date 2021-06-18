import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Account,
} from '@solana/web3.js';
import { utils, models, sendTransaction, TokenAccount } from '@oyster/common';
import { withDepositGoverningTokens } from '../models/withDepositGoverningTokens';

const { approve } = models;

const { notify } = utils;

export const depositGoverningTokens = async (
  connection: Connection,
  realm: PublicKey,
  governingTokenSource: TokenAccount,
  governingTokenMint: PublicKey,
  wallet: any,
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const transferAuthority = approve(
    instructions,
    [],
    governingTokenSource.pubkey,
    wallet.publicKey,
    governingTokenSource.info.amount.toNumber(),
  );

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    wallet.publicKey,
    transferAuthority.publicKey,
    wallet.publicKey,
  );

  notify({
    message: 'Depositing governing tokens...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, signers);

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
