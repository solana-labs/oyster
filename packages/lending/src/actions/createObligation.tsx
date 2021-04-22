import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ObligationLayout } from '../models';
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
    ObligationLayout.span,
  );
}
