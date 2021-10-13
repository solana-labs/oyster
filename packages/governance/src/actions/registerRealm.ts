import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { MintMaxVoteWeightSource } from '../models/accounts';
import { RpcContext } from '../models/api';

import { withCreateRealm } from '../models/withCreateRealm';
import { sendTransactionWithNotifications } from '../tools/transactions';

export async function registerRealm(
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  name: string,
  communityMint: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityTokensToCreateGovernance: BN,
) {
  let instructions: TransactionInstruction[] = [];

  const realmAddress = await withCreateRealm(
    instructions,
    programId,
    programVersion,
    name,
    walletPubkey,
    communityMint,
    walletPubkey,
    councilMint,
    communityMintMaxVoteWeightSource,
    minCommunityTokensToCreateGovernance,
    undefined,
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
