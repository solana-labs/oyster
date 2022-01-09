import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/governance-sdk';
import { withRelinquishVote } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

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
