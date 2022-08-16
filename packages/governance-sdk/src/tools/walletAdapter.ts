import { PublicKey, Transaction } from '@solana/web3.js';

export type WalletSigner = {
  publicKey: PublicKey | null;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transaction: Transaction[]): Promise<Transaction[]>;
};

export declare class WalletError extends Error {
  error: any;
  constructor(message?: string, error?: any);
}

export declare class WalletNotConnectedError extends WalletError {
  name: string;
}

export function isWalletNotConnectedError(
  error: any,
): error is WalletNotConnectedError {
  // fixes Unhandled Rejection (ReferenceError): WalletNotConnectedError is not defined
  return error instanceof Error;
}
