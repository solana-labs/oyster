import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withRelinquishVote } from '../models/withRelinquishVote';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

export const relinquishVote = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  tokenOwnerRecord: PublicKey,
  voteRecord: PublicKey,
  IsWithdrawal: boolean,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let beneficiary = walletPubkey;

  withRelinquishVote(
    instructions,
    programId,
    proposal.info.governance,
    proposal.pubkey,
    tokenOwnerRecord,
    proposal.info.governingTokenMint,
    voteRecord,
    governanceAuthority,
    beneficiary,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    IsWithdrawal ? 'Withdrawing vote from proposal' : 'Releasing voting tokens',
    IsWithdrawal ? 'Vote withdrawn' : 'Tokens released',
  );
};
