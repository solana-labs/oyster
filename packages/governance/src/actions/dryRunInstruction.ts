import { ProposalInstruction } from '../models/accounts';
import { RpcContext } from '../models/api';
import { ParsedAccount, simulateTransaction } from '@oyster/common';
import { Transaction } from '@solana/web3.js';

export async function dryRunInstruction(
  { connection, wallet }: RpcContext,
  proposalInstruction: ParsedAccount<ProposalInstruction>,
) {
  let transaction = new Transaction({ feePayer: wallet!.publicKey });
  transaction.add({
    keys: proposalInstruction.info.instruction.accounts,
    programId: proposalInstruction.info.instruction.programId,
    data: Buffer.from(proposalInstruction.info.instruction.data),
  });

  const result = await simulateTransaction(
    connection,
    transaction,
    'singleGossip',
  );

  return { response: result.value, transaction };
}
