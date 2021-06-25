import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateRealm } from '../models/withCreateRealm';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const registerRealm = async (
  connection: Connection,
  wallet: any,
  name: string,
  communityMint: PublicKey,
  councilMint?: PublicKey,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  const { realmAddress } = await withCreateRealm(
    instructions,
    name,
    communityMint,
    wallet.publicKey,
    councilMint,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Registering realm',
    'Realm has been registered',
  );

  return realmAddress;
};
