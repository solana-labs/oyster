import { TransactionError } from '@solana/web3.js';

export class SendTransactionError extends Error {
  txError: TransactionError;
  txId: string;
  constructor(message: string, txId: string, txError: TransactionError) {
    super(message);

    this.txError = txError;
    this.txId = txId;
  }
}

export class SignTransactionError extends Error {
  constructor(message: string) {
    super(message);
  }
}
