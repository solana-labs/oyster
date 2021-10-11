import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';

import { withFinalizeVote } from '../models/withFinalizeVote';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/api';

export const finalizeVote = async (
  { connection, wallet, programId }: RpcContext,
  realm: PublicKey,
  proposal: ParsedAccount<Proposal>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFinalizeVote(
    instructions,
    programId,
    realm,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
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
