import { Account, TransactionInstruction } from '@solana/web3.js';

import { Governance } from '../models/accounts';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

import { withCreateNativeTreasury } from '../models/withCreateNativeTreasury';
import { ProgramAccount } from '../models/tools/solanaSdk';

export const createNativeTreasury = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,

  governance: ProgramAccount<Governance>,
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
