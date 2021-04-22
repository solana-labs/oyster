import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ReserveLayout } from '../models';
import { createAccount } from './createAccount';

export function createReserve(
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
    ReserveLayout.span,
  );
}
