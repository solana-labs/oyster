import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { RpcContext } from '../models/api';

import { withCreateRealm } from '../models/withCreateRealm';
import { sendTransactionWithNotifications } from '../tools/transactions';

export async function registerRealm(
  { connection, wallet, programId, walletPubkey }: RpcContext,
  name: string,
  communityMint: PublicKey,
  councilMint?: PublicKey,
) {
  let instructions: TransactionInstruction[] = [];

  const realmAddress = await withCreateRealm(
    instructions,
    programId,
    name,
    communityMint,
    walletPubkey,
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
}
