import {
  AccountInfo,
  PublicKey,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import * as Layout from "./../../utils/layout";

export const LendingReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("isInitialized"),
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquiditySupply"),
    Layout.publicKey("liquidityMint"),
    Layout.publicKey("collateralSupply"),
    Layout.publicKey("collateralMint"),
    // TODO: replace u32 option with generic quivalent
    BufferLayout.u32('dexMarketOption'),
    Layout.publicKey("dexMarket"),
    Layout.uint64("dexMarketPrice"),
    Layout.uint64("dexMarketPriceUpdatedSlot"),

    Layout.uint128("cumulative_borrow_rate"),
    Layout.uint128("total_borrows"),
    Layout.uint64("borrow_state_update_slot"),
  ]
);

export const isLendingReserve = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingReserveLayout.span;
}

export interface LendingReserve {
  isInitialized: boolean,
  lendingMarket: PublicKey;
  liquiditySupply: PublicKey;
  liquidityMint: PublicKey;
  collateralSupply: PublicKey;
  collateralMint: PublicKey;
  // TODO: replace u32 option with generic quivalent
  dexMarketOption: number;
  dexMarket: PublicKey;
  dexMarketPrice: BN; // what is precision on the price?

  dexMarketPriceUpdatedSlot: BN;

  // Layout.uint128("cumulative_borrow_rate"),
  // Layout.uint128("total_borrows"),
  borrow_state_update_slot: BN;
}

export const LendingReserveParser = (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
  const buffer = Buffer.from(info.data);
  const data = LendingReserveLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: data,
  };

  return details;
};

// TODO:
// create instructions for init, deposit and withdraw