import { AccountLayout } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { createTokenAccount } from '../tools/splToken';

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
