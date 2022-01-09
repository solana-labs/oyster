import { Account, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/governance-sdk';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

import { withCancelProposal } from '@solana/governance-sdk';

export async function cancelProposal(
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
) {
  let governanceAuthority = walletPubkey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withCancelProposal(
    instructions,
    programId,
    programVersion,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    governanceAuthority,
    proposal.account.governance,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Cancelling proposal',
    'Proposal cancelled',
  );
}
