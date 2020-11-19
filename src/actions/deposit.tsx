import {
  Account,
  AccountInfo,
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import * as Layout from "./../utils/layout";
import { depositInstruction, initReserveInstruction, LendingReserve } from "./../models/lending/reserve";
import { AccountLayout, MintInfo, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants/ids";
import { createUninitializedAccount, ensureSplAccount, findOrCreateAccountByMint } from "./account";
import { cache, GenericAccountParser, MintParser, ParsedAccount } from "../contexts/accounts";
import { TokenAccount } from "../models";
import { isConstructorDeclaration } from "typescript";
import { LendingMarketParser } from "../models/lending";
import { sign } from "crypto";
import { fromLamports, toLamports } from "../utils/utils";

export const deposit = async (
  from: TokenAccount,
  amount: number,
  reserve: LendingReserve,
  reserveAddress: PublicKey,
  connection: Connection,
  wallet: any) => {

  // TODO: customize ?
  const MAX_UTILIZATION_RATE = 80;

  notify({
    message: "Depositing funds...",
    description: "Please review transactions to approve.",
    type: "warn",
  });

  const isInitalized = true; // TODO: finish reserve init

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const [authority] = await PublicKey.findProgramAddress(
    [reserve.lendingMarket.toBuffer()], // which account should be authority
    LENDING_PROGRAM_ID
  );

  const mint = (await cache.query(connection, reserve.liquidityMint, MintParser)) as ParsedAccount<MintInfo>;
  const amountLamports = toLamports(amount, mint?.info);

  const fromAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    from,
    wallet.publicKey,
    amountLamports + accountRentExempt,
    signers
  );

  // create approval for transfer transactions
  instructions.push(
    Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      fromAccount,
      authority,
      wallet.publicKey,
      [],
      amountLamports,
    )
  );

  let toAccount: PublicKey;
  if (isInitalized) {
    // get destination account
    toAccount = await findOrCreateAccountByMint(
      wallet.publicKey,
      wallet.publicKey,
      instructions,
      cleanupInstructions,
      accountRentExempt,
      reserve.collateralMint,
      signers
    );
  } else {
    toAccount = createUninitializedAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      signers,
    );
  }

  if (isInitalized) {
    // deposit  
    instructions.push(
      depositInstruction(
        amountLamports,
        fromAccount,
        toAccount,
        authority,
        reserveAddress,
        reserve.liquiditySupply,
        reserve.collateralMint,
      )
    );
  } else {
    // TODO: finish reserve init
    instructions.push(initReserveInstruction(
      amountLamports,
      MAX_UTILIZATION_RATE,
      fromAccount,
      toAccount,
      reserveAddress,
      reserve.liquidityMint,
      reserve.liquiditySupply,
      reserve.collateralMint,
      reserve.collateralSupply,
      reserve.lendingMarket,
      authority,
      reserve.dexMarket,
    ));
  }

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true
    );

    notify({
      message: "Funds deposited.",
      type: "success",
      description: `Transaction - ${tx}`,
    });
  } catch {
    // TODO:
  }
}
