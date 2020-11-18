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

export const LendingReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    Layout.uint64("lastUpdateSlot"),
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMint"),
    Layout.publicKey("liquiditySupply"),
    Layout.publicKey("collateralMint"),
    Layout.publicKey("collateralSupply"),
    // TODO: replace u32 option with generic quivalent
    BufferLayout.u32('dexMarketOption'),
    Layout.publicKey("dexMarket"),
    BufferLayout.u8("maxUtilizationRate"),

    Layout.uint128("cumulative_borrow_rate"),
    Layout.uint128("total_borrows"),

    Layout.uint64("totalLiquidity"),
    Layout.uint64("collateralMintSupply"),
  ]
);

export const isLendingReserve = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingReserveLayout.span;
}

export interface LendingReserve {
  lastUpdateSlot: BN;

  lendingMarket: PublicKey;
  liquiditySupply: PublicKey;
  liquidityMint: PublicKey;
  collateralSupply: PublicKey;
  collateralMint: PublicKey;
  // TODO: replace u32 option with generic quivalent
  dexMarketOption: number;
  dexMarket: PublicKey;
  dexMarketPrice: BN; // what is precision on the price?

  maxUtilizationRate: number;
  dexMarketPriceUpdatedSlot: BN;

  // Layout.uint128("cumulative_borrow_rate"),
  // Layout.uint128("total_borrows"),
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

export const initReserveInstruction = (
  liquidityAmount: number | BN,
  maxUtilizationRate: number,

  from: PublicKey, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Collateral output SPL Token account,

  reserveAccount: PublicKey,
  liquidityMint: PublicKey,
  liquiditySupply: PublicKey,
  collateralMint: PublicKey,
  collateralSupply: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,

  dexMarket: PublicKey, // TODO: optional
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
    BufferLayout.u8("maxUtilizationRate")
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1, // Init reserve instruction
      liquidityAmount: new BN(liquidityAmount),
      maxUtilizationRate: maxUtilizationRate,
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: reserveAccount, isSigner: false, isWritable: true },
    { pubkey: liquidityMint, isSigner: false, isWritable: false },
    { pubkey: liquiditySupply, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: collateralSupply, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },

    // optionals
    { pubkey: dexMarket, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};

/// Deposit liquidity into a reserve. The output is a collateral token representing ownership
/// of the reserve liquidity pool.
///
///   0. `[writable]` Liquidity input SPL Token account. $authority can transfer $liquidity_amount
///   1. `[writable]` Collateral output SPL Token account,
///   2. `[writable]` Reserve account.
///   3. `[writable]` Reserve liquidity supply SPL Token account.
///   4. `[writable]` Reserve collateral SPL Token mint.
///   5. `[]` Derived lending market authority ($authority).
///   6. `[]` Clock sysvar
///   7. '[]` Token program id
export const depositInstruction = (
  liquidityAmount: number | BN,
  from: PublicKey, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Collateral output SPL Token account,
  reserveAuthority: PublicKey,
  reserveAccount: PublicKey,
  reserveSupply: PublicKey,
  collateralMint: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 2, // Deposit instruction
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: reserveAccount, isSigner: false, isWritable: true },
    { pubkey: reserveSupply, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: reserveAuthority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
