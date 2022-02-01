import { Keypair, TransactionInstruction } from '@solana/web3.js';

import { Proposal, ProposalTransaction } from '@solana/spl-governance';

import { withExecuteInstruction } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const executeInstruction = async (
  { connection, wallet, programId, programVersion }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  instruction: ProgramAccount<ProposalTransaction>,
) => {
  let signers: Keypair[] = [];
  let instructions: TransactionInstruction[] = [];

  await withExecuteInstruction(
    instructions,
    programId,
    programVersion,
    proposal.account.governance,
    proposal.pubkey,
    instruction.pubkey,
    instruction.account.getFirstInstruction(),
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
