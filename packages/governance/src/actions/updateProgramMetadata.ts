import { Account, TransactionInstruction } from '@solana/web3.js';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

import { withUpdateProgramMetadata } from '../models/withUpdateProgramMetadata';

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
