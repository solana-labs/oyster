import { OBLIGATION_SIZE } from '@solana/spl-token-lending';
import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createAccount } from './createAccount';

export function createObligation(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  amount: number,
  signers: Account[],
) {
  return createAccount(
    instructions,
    payer,
    amount,
    signers,
    OBLIGATION_SIZE,
  );
}
