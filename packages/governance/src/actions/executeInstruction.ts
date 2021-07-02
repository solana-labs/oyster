import { Account, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal, ProposalInstruction } from '../models/accounts';

import { withExecuteInstruction } from '../models/withExecuteInstruction';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/api';

export const executeInstruction = async (
  { connection, wallet, programId }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  instruction: ParsedAccount<ProposalInstruction>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  await withExecuteInstruction(
    instructions,
    programId,
    proposal.info.governance,
    proposal.pubkey,
    instruction.pubkey,
    instruction.info.instruction,
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
