import { Account, TransactionInstruction } from '@solana/web3.js';

import { Governance } from '@solana/governance-sdk';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';

import { withCreateNativeTreasury } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

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
