import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import { LendingReserve } from "./../models/lending/reserve";
import { repayInstruction } from "./../models/lending/repay";
import { AccountLayout, Token, NATIVE_MINT } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../utils/ids";
import { createTokenAccount, findOrCreateAccountByMint } from "./account";
import { approve, LendingObligation, TokenAccount } from "../models";
import { ParsedAccount } from "../contexts/accounts";

export const repay = async (
  from: TokenAccount,
  repayAmount: number,

  // which loan to repay
  obligation: ParsedAccount<LendingObligation>,

  obligationToken: TokenAccount,

  repayReserve: ParsedAccount<LendingReserve>,

  withdrawReserve: ParsedAccount<LendingReserve>,

  connection: Connection,
  wallet: any
) => {
  notify({
    message: 'Repaying funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

  const [authority] = await PublicKey.findProgramAddress(
    [repayReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID
  );

  let fromAccount = from.pubkey;
  if (wallet.publicKey.equals(fromAccount) && repayReserve.info.liquidityMint.equals(NATIVE_MINT)) {
    fromAccount = createTokenAccount(instructions, wallet.publicKey, accountRentExempt + repayAmount, NATIVE_MINT, wallet.publicKey, signers);
    cleanupInstructions.push(Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, fromAccount, wallet.publicKey, wallet.publicKey, []));
  }

  // create approval for transfer transactions
  approve(
    instructions,
    cleanupInstructions,
    fromAccount,
    authority,
    wallet.publicKey,
    repayAmount
  );

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    withdrawReserve.info.collateralMint,
    signers
  );

  // create approval for transfer transactions
  approve(
    instructions,
    cleanupInstructions,
    obligationToken.pubkey,
    authority,
    wallet.publicKey,
    obligationToken.info.amount.toNumber()
  );

  // TODO: add obligation

  instructions.push(
    repayInstruction(
      repayAmount,
      fromAccount,
      toAccount,
      repayReserve.pubkey,
      repayReserve.info.liquiditySupply,
      withdrawReserve.pubkey,
      withdrawReserve.info.collateralSupply,
      obligation.pubkey,
      obligation.info.tokenMint,
      obligationToken.pubkey,
      authority
    )
  );

  let tx = await sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true);

  notify({
    message: 'Funds repaid.',
    type: 'success',
    description: `Transaction - ${tx}`,
  });
};
