import { Account, TransactionInstruction } from '@solana/web3.js';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';

import { withUpdateProgramMetadata } from '@solana/governance-sdk';

export const updateProgramMetadata = async ({
  connection,
  wallet,
  programId,
  walletPubkey,
}: RpcContext) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  await withUpdateProgramMetadata(instructions, programId, walletPubkey);

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Updating Program Metadata',
    'Program Metadata Updated',
  );
};
