import { LENDING_PROGRAM_ID } from '@oyster/common';
import {
  Account,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

export function createAccount(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  amount: number,
  signers: Account[],
  space: number,
) {
  const account = new Account();

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space,
      programId: LENDING_PROGRAM_ID,
    }),
  );

  signers.push(account);

  return account.publicKey;
}
