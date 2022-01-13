import { Keypair, TransactionInstruction } from '@solana/web3.js';

import { Governance } from '@solana/spl-governance';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';

import { withCreateNativeTreasury } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const createNativeTreasury = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,

  governance: ProgramAccount<Governance>,
) => {
  let signers: Keypair[] = [];
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
