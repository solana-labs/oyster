import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../models/accounts';

import { withFlagInstructionError } from '../models/withFlagInstructionError';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ProgramAccount } from '../models/tools/solanaSdk';

export const flagInstructionError = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  proposalInstruction: PublicKey,
) => {
  let governanceAuthority = walletPubkey;

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withFlagInstructionError(
    instructions,
    programId,
    proposal.pubkey,
    proposal.account.tokenOwnerRecord,
    governanceAuthority,
    proposalInstruction,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Flagging instruction as broken',
    'Instruction flagged as broken',
  );
};
