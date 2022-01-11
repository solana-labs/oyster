import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { MintMaxVoteWeightSource } from '@solana/spl-governance';
import { RpcContext } from '@solana/spl-governance';

import { withCreateRealm } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';

export async function registerRealm(
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  name: string,
  communityMint: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityTokensToCreateGovernance: BN,
  communityVoterWeightAddin: PublicKey | undefined,
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
    communityVoterWeightAddin,
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
