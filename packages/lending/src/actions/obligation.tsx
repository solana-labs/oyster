import {
  Account,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import { LendingObligationLayout } from '../models';
const { LENDING_PROGRAM_ID } = utils;
export function createUninitializedObligation(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  amount: number,
  signers: Account[],
) {
  const account = new Account();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: LendingObligationLayout.span,
      programId: LENDING_PROGRAM_ID,
    }),
  );

  signers.push(account);

  return account.publicKey;
}
