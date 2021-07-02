import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { RpcContext } from '../models/api';

import { withCreateRealm } from '../models/withCreateRealm';
import { sendTransactionWithNotifications } from '../tools/transactions';

export async function registerRealm(
  rpcContext: RpcContext,
  name: string,
  communityMint: PublicKey,
  councilMint?: PublicKey,
) {
  let instructions: TransactionInstruction[] = [];

  const realmAddress = await withCreateRealm(
    instructions,
    rpcContext.programId,
    name,
    communityMint,
    rpcContext.getWalletPubkey(),
    councilMint,
  );

  await sendTransactionWithNotifications(
    rpcContext.connection,
    rpcContext.wallet,
    instructions,
    [],
    'Registering realm',
    'Realm has been registered',
  );

  return realmAddress;
}
