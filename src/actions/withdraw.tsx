import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import { LendingReserve, withdrawInstruction } from "./../models/lending";
import { AccountLayout } from "@solana/spl-token";
import { LENDING_PROGRAM_ID } from "../utils/ids";
import { findOrCreateAccountByMint } from "./account";
import { approve, TokenAccount } from "../models";

export const withdraw = async (
  from: TokenAccount, // CollateralAccount
  amountLamports: number, // in collateral token (lamports)
  reserve: LendingReserve,
  reserveAddress: PublicKey,
  connection: Connection,
  wallet: any
) => {
  notify({
    message: 'Withdrawing funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

  const [authority] = await PublicKey.findProgramAddress([reserve.lendingMarket.toBuffer()], LENDING_PROGRAM_ID);

  const fromAccount = from.pubkey;

  // create approval for transfer transactions
  const transferAuthority = approve(
      instructions,
      cleanupInstructions,
      fromAccount,
      wallet.publicKey,
      amountLamports
  );

  signers.push(transferAuthority);

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    reserve.liquidityMint,
    signers
  );

  instructions.push(
    withdrawInstruction(
      amountLamports,
      fromAccount,
      toAccount,
      reserveAddress,
      reserve.collateralMint,
      reserve.liquiditySupply,
      reserve.lendingMarket,
      authority,
      transferAuthority.publicKey,
    )
  );

  try {
    let tx = await sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true);

    notify({
      message: 'Funds deposited.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch {
    // TODO:
  }
};
