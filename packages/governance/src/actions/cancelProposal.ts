import { Account, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withCancelProposal } from '../models/withCancelProposal';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

export const cancelProposal = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
) => {
  let governanceAuthority = walletPubkey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withCancelProposal(
    instructions,
    programId,
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
