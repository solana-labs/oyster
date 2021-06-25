import { Account, Connection, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withCancelProposal } from '../models/withCancelProposal';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const cancelProposal = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
) => {
  let governanceAuthority = wallet.publicKey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withCancelProposal(
    instructions,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
    governanceAuthority,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Cancelling proposal',
    'Proposal cancelled',
  );
};
