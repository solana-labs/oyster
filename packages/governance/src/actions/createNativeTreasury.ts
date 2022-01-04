import { Account, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Governance } from '../models/accounts';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

import { withCreateNativeTreasury } from '../models/withCreateNativeTreasury';

export const createNativeTreasury = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,

  governance: ParsedAccount<Governance>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  await withCreateNativeTreasury(
    instructions,
    programId,
    governance.pubkey,
    walletPubkey,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Creating SOL treasury',
    'SOL treasury created',
  );
};
