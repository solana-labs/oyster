import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/governance-sdk';

import { withRemoveInstruction } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export const removeInstruction = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const governanceAuthority = walletPubkey;
  const beneficiary = walletPubkey;

  await withRemoveInstruction(
    instructions,
    programId,
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
