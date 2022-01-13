import { Keypair, TransactionInstruction } from '@solana/web3.js';

import { Proposal, ProposalInstruction } from '@solana/spl-governance';

import { withExecuteInstruction } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const executeInstruction = async (
  { connection, wallet, programId }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  instruction: ProgramAccount<ProposalInstruction>,
) => {
  let signers: Keypair[] = [];
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
