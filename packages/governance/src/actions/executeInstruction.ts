import { Account, TransactionInstruction } from '@solana/web3.js';

import { Proposal, ProposalInstruction } from '../models/accounts';

import { withExecuteInstruction } from '../models/withExecuteInstruction';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { ProgramAccount } from '../models/tools/solanaSdk';

export const executeInstruction = async (
  { connection, wallet, programId }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  instruction: ProgramAccount<ProposalInstruction>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  await withExecuteInstruction(
    instructions,
    programId,
    proposal.account.governance,
    proposal.pubkey,
    instruction.pubkey,
    instruction.account.instruction,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Executing instruction',
    'Instruction executed',
  );
};
