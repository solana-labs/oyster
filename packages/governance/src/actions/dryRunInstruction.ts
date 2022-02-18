import { InstructionData, RpcContext } from '@solana/spl-governance';
import { simulateTransaction } from '@oyster/common';
import { Transaction } from '@solana/web3.js';

export async function dryRunInstruction(
  rpc: RpcContext,
  instructionData: InstructionData,
) {
  return dryRunInstructions(rpc, [instructionData]);
}

export async function dryRunInstructions(
  { connection, wallet }: RpcContext,
  instructions: InstructionData[],
) {
  let transaction = new Transaction({ feePayer: wallet!.publicKey });

  for (let ins of instructions)
    transaction.add({
      keys: ins.accounts,
      programId: ins.programId,
      data: Buffer.from(ins.data),
    });

  const result = await simulateTransaction(
    connection,
    transaction,
    'singleGossip',
  );

  return { response: result.value, transaction };
}
