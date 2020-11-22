import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import {
  LendingReserve,
} from "./../models/lending/reserve";
import {
  repayInstruction,
} from "./../models/lending/repay";
import { AccountLayout, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants/ids";
import { findOrCreateAccountByMint } from "./account";
import { LendingObligation, TokenAccount } from "../models";

export const repay = async (
  from: TokenAccount, // CollateralAccount
  amountLamports: number, // in collateral token (lamports)

  // which loan to repay
  obligation: LendingObligation,

  repayReserve: LendingReserve,
  repayReserveAddress: PublicKey,

  withdrawReserve: LendingReserve,
  withdrawReserveAddress: PublicKey,

  connection: Connection,
  wallet: any
) => {
  notify({
    message: "Repaing funds...",
    description: "Please review transactions to approve.",
    type: "warn",
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const [authority] = await PublicKey.findProgramAddress(
    [repayReserve.lendingMarket.toBuffer()], 
    LENDING_PROGRAM_ID
  );

  const fromAccount = from.pubkey;

  // create approval for transfer transactions
  instructions.push(
    Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      fromAccount,
      authority,
      wallet.publicKey,
      [],
      amountLamports
    )
  );

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    withdrawReserve.liquidityMint,
    signers
  );

  // TODO: add obligation

  // instructions.push(
  //   repayInstruction(
  //     amountLamports,
  //     fromAccount,
  //     toAccount,
  //     reserveAddress,
  //     reserve.collateralMint,
  //     reserve.liquiditySupply,
  //     authority
  //   )
  // );

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true
    );

    notify({
      message: "Funds repaid.",
      type: "success",
      description: `Transaction - ${tx}`,
    });
  } catch {
    // TODO:
  }
};
