import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';
import { withRelinquishVote } from '../models/withRelinquishVote';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ProgramAccount } from '../models/tools/solanaSdk';

export const relinquishVote = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
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
    proposal.account.governance,
    proposal.pubkey,
    tokenOwnerRecord,
    proposal.account.governingTokenMint,
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
