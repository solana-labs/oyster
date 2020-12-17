import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import * as Layout from "./../../utils/layout";

export const LendingObligationLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    /// Slot when obligation was updated. Used for calculating interest.
    Layout.uint64("lastUpdateSlot"),
    /// Amount of collateral tokens deposited for this obligation
    Layout.uint64("depositedCollateral"),
    /// Reserve which collateral tokens were deposited into
    Layout.publicKey("collateralReserve"),
    /// Borrow rate used for calculating interest.
    Layout.uint128("cumulativeBorrowRateWad"),
    /// Amount of tokens borrowed for this obligation plus interest
    Layout.uint128("borrowAmountWad"),
    /// Reserve which tokens were borrowed from
    Layout.publicKey("borrowReserve"),
    /// Mint address of the tokens for this obligation
    Layout.publicKey("tokenMint"),
  ]
);

export const isLendingObligation = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingObligationLayout.span;
};

export interface LendingObligation {
  lastUpdateSlot: BN;
  depositedCollateral: BN;
  collateralReserve: PublicKey;
  cumulativeBorrowRateWad: BN; // decimals
  borrowAmountWad: BN; // decimals
  borrowReserve: PublicKey;
  tokenMint: PublicKey;
}

export const LendingObligationParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>
) => {
  const buffer = Buffer.from(info.data);
  const data = LendingObligationLayout.decode(buffer); 

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: data,
  };

  return details;
};
