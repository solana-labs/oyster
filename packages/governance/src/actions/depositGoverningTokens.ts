import { PublicKey, TransactionInstruction, Account } from '@solana/web3.js';
import { models, TokenAccount } from '@oyster/common';
import { withDepositGoverningTokens } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';

const { approve } = models;

export const depositGoverningTokens = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  governingTokenSource: TokenAccount,
  governingTokenMint: PublicKey,
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const amount = governingTokenSource.info.amount;

  const transferAuthority = approve(
    instructions,
    [],
    governingTokenSource.pubkey,
    walletPubkey,
    amount,
  );

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
    amount,
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
