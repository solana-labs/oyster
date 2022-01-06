import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';

import { withFinalizeVote } from '../models/withFinalizeVote';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ProgramAccount } from '../models/tools/solanaSdk';

export const finalizeVote = async (
  { connection, wallet, programId }: RpcContext,
  realm: PublicKey,
  proposal: ProgramAccount<Proposal>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFinalizeVote(
    instructions,
    programId,
    realm,
    proposal.account.governance,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    proposal.account.governingTokenMint,
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
