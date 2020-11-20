import {
  AccountInfo,
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants/ids";
import { sendTransaction } from "../../contexts/connection";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from './lending';

export const LendingObligationLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
  /// Slot when obligation was updated. Used for calculating interest.
  Layout.uint64("lastUpdateSlot"),
  /// Amount of collateral tokens deposited for this obligation
  Layout.uint64("collateralAmount"),
  /// Reserve which collateral tokens were deposited into
  Layout.publicKey("collateralSupply"),
  /// Borrow rate used for calculating interest.
  Layout.uint128("cumulativeBorrowRate"),
  /// Amount of tokens borrowed for this obligation plus interest
  Layout.uint128("borrowAmount"),
  /// Reserve which tokens were borrowed from
  Layout.publicKey("borrowReserve"),
  /// Mint address of the tokens for this obligation
  Layout.publicKey("tokenMint"),
  ]
);

export interface LendingObligation {
  lastUpdateSlot: BN;
  collateralAmount: BN;
  collateralSupply: PublicKey;
  cumulativeBorrowRate: BN; // decimals
  borrowAmount: BN; // decimals
  borrowReserve: PublicKey;
  tokenMint: PublicKey;
}