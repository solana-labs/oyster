import { PublicKey, TransactionInstruction, Account } from '@solana/web3.js';
import { models, TokenAccount } from '@oyster/common';
import { withDepositGoverningTokens } from '../models/withDepositGoverningTokens';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

const { approve } = models;

export const depositGoverningTokens = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realm: PublicKey,
  governingTokenSource: TokenAccount,
  governingTokenMint: PublicKey,
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const transferAuthority = approve(
    instructions,
    [],
    governingTokenSource.pubkey,
    walletPubkey,
    governingTokenSource.info.amount,
  );

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    programId,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
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
