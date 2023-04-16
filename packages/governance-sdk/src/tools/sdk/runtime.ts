import {
  Commitment,
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
  TransactionError,
} from '@solana/web3.js';

export const SYSTEM_PROGRAM_ID = new PublicKey(
  '11111111111111111111111111111111',
);

export type ProgramAccount<T> = {
  pubkey: PublicKey;
  account: T;
  owner: PublicKey;
};

export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  const latestBlockhash = await connection.getRecentBlockhash();
  //@ts-ignore
  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  transaction.recentBlockhash = latestBlockhash.blockhash;

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config: any = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message);
  }
  return res.result;
}

export class SendTransactionError extends Error {
  txError: TransactionError | undefined;
  txId: string;
  constructor(message: string, txId: string, txError?: TransactionError) {
    super(message);

    this.txError = txError;
    this.txId = txId;
  }
}
