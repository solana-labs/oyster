import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { GovernanceConfig } from '../models/accounts';

import { sendTransactionWithNotifications } from '../tools/transactions';

import { withCreateTokenGovernance } from '../models/withCreateTokenGovernance';
import { RpcContext } from '../models/core/api';
import { withCreateSplTokenAccount } from '../models/splToken/withCreateSplTokenAccount';

export const createTreasuryAccount = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realm: PublicKey,
  mint: PublicKey,
  config: GovernanceConfig,
  tokenOwnerRecord: PublicKey,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const tokenAccount = await withCreateSplTokenAccount(
    instructions,
    signers,
    connection,
    mint,
    walletPubkey,
    walletPubkey,
  );

  let governanceAddress;
  let governanceAuthority = walletPubkey;

  governanceAddress = (
    await withCreateTokenGovernance(
      instructions,
      programId,
      realm,
      tokenAccount,
      config,
      true,
      walletPubkey,
      tokenOwnerRecord,
      walletPubkey,
      governanceAuthority,
    )
  ).governanceAddress;

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Creating treasury account',
    'Treasury account has been created',
  );

  return governanceAddress;
};
