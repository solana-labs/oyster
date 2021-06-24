import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Account,
} from '@solana/web3.js';
import { models, TokenAccount } from '@oyster/common';
import { withDepositGoverningTokens } from '../models/withDepositGoverningTokens';
import { sendTransactionWithNotifications } from '../tools/transactions';

const { approve } = models;

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

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Depositing governing tokens',
    'Tokens have been deposited',
  );
};
