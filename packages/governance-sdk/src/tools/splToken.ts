import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Account,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Connection,
} from '@solana/web3.js';

export function createTokenAccount(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  accountRentExempt: number,
  mint: PublicKey,
  owner: PublicKey,
  signers: Account[],
) {
  const account = createUninitializedTokenAccount(
    instructions,
    payer,
    accountRentExempt,
    signers,
  );

  instructions.push(
    Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, account, owner),
  );

  return account;
}

export function createUninitializedTokenAccount(
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
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  signers.push(account);

  return account.publicKey;
}

export const withCreateSplTokenAccount = async (
  instructions: TransactionInstruction[],
  signers: Account[],
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey,
) => {
  const tokenAccountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const tokenAccountAddress = createTokenAccount(
    instructions,
    payer,
    tokenAccountRentExempt,
    mint,
    owner,
    signers,
  );

  return tokenAccountAddress;
};
