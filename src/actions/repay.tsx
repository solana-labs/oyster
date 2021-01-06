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
import { AccountLayout } from "@solana/spl-token";
import { LENDING_PROGRAM_ID } from "../utils/ids";
import { findOrCreateAccountByMint } from "./account";
import { approve, LendingObligation, TokenAccount } from "../models";
import { ParsedAccount } from "../contexts/accounts";

export const repay = async (
  from: TokenAccount, // CollateralAccount
  amountLamports: number, // in collateral token (lamports)

  // which loan to repay
  obligation: ParsedAccount<LendingObligation>,

  obligationToken: TokenAccount,

  repayReserve: ParsedAccount<LendingReserve>,

  withdrawReserve: ParsedAccount<LendingReserve>,

  connection: Connection,
  wallet: any
) => {
  notify({
    message: 'Repaing funds...',
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
    withdrawReserve.info.collateralMint,
    signers
  );

  // create approval for transfer transactions
  approve(
    instructions,
    cleanupInstructions,
    obligationToken.pubkey,
    wallet.publicKey,
    obligationToken.info.amount.toNumber(),

    // reuse transfer authority
    transferAuthority.publicKey,
  );

  // TODO: add obligation

  instructions.push(
    repayInstruction(
      amountLamports,
      fromAccount,
      toAccount,
      repayReserve.pubkey,
      repayReserve.info.liquiditySupply,
      withdrawReserve.pubkey,
      withdrawReserve.info.collateralSupply,
      obligation.pubkey,
      obligation.info.tokenMint,
      obligationToken.pubkey,
      repayReserve.info.lendingMarket,
      authority,
      transferAuthority.publicKey,
    )
  );

  let tx = await sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true);

  notify({
    message: 'Funds repaid.',
    type: 'success',
    description: `Transaction - ${tx}`,
  });
};
