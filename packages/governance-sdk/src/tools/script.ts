import { AccountMeta, PublicKey } from '@solana/web3.js';

export function getErrorMessage(ex: any) {
  if (ex instanceof Error) {
    return ex.message;
  }

  return JSON.stringify(ex);
}

export const shortMeta = (
  pubkey: PublicKey,
  isWritable = false,
  isSigner = false,
): AccountMeta => ({ pubkey, isSigner, isWritable });
