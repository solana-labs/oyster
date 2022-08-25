import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/spl-governance';

import { withRemoveTransaction } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const removeInstruction = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  const governanceAuthority = walletPubkey;
  const beneficiary = walletPubkey;

  await withRemoveTransaction(
    instructions,
    programId,
    programVersion,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    governanceAuthority,
    proposalInstruction,
    beneficiary,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Removing instruction',
    'Instruction removed',
  );
};
