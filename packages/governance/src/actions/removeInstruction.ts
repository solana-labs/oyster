import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';

import { withRemoveInstruction } from '../models/withRemoveInstruction';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ProgramAccount } from '../models/tools/solanaSdk';

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
