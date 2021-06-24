import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withWithdrawGoverningTokens } from '../models/withWithdrawGoverningTokens';
import { sendTransactionWithNotifications } from '../tools/transactions';

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

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Withdrawing governing tokens',
    'Tokens have been withdrawn.',
  );
};
