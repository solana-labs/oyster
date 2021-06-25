import { Account, Connection, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withFinalizeVote } from '../models/withFinalizeVote';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const finalizeVote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFinalizeVote(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.governingTokenMint,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Finalizing vote',
    'Vote finalized',
  );
};
