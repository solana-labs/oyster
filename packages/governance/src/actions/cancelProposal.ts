import { Keypair, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/spl-governance';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

import { withCancelProposal } from '@solana/spl-governance';

export async function cancelProposal(
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
) {
  let governanceAuthority = walletPubkey;

  let signers: Keypair[] = [];
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
