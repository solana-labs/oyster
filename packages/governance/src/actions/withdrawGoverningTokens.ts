import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { RpcContext } from '../models/api';

import { withWithdrawGoverningTokens } from '../models/withWithdrawGoverningTokens';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const withdrawGoverningTokens = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realm: PublicKey,
  governingTokenDestination: PublicKey,
  governingTokenMint: PublicKey,
) => {
  let instructions: TransactionInstruction[] = [];

  await withWithdrawGoverningTokens(
    instructions,
    programId,
    realm,
    governingTokenDestination,
    governingTokenMint,
    walletPubkey,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Withdrawing governing tokens',
    'Tokens have been withdrawn',
  );
};
