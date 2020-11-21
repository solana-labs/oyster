import {
  AccountInfo,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants/ids";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from './lending';

export const LendingReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    Layout.uint64("lastUpdateSlot"),
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMint"),
    BufferLayout.u8("liquidityMintDecimals"),
    Layout.publicKey("liquiditySupply"),
    Layout.publicKey("collateralMint"),
    Layout.publicKey("collateralSupply"),
    // TODO: replace u32 option with generic quivalent
    BufferLayout.u32('dexMarketOption'),
    Layout.publicKey("dexMarket"),

    BufferLayout.struct([
      /// Max utilization rate as a percent
      BufferLayout.u8("maxUtilizationRate"),
      /// The ratio of the loan to the value of the collateral as a percent
      BufferLayout.u8("loanToValueRatio"),
      /// The percent discount the liquidator gets when buying collateral for an unhealthy obligation
      BufferLayout.u8("liquidationBonus"),
      /// The percent at which an obligation is considered unhealthy
      BufferLayout.u8("liquidationThreshold"),
    ], "config"),

    Layout.uint128("cumulativeBorrowRate"),
    Layout.uint128("totalBorrows"),

    Layout.uint64("totalLiquidity"),
    Layout.uint64("collateralMintSupply"),
  ]
);

export const isLendingReserve = (info: AccountInfo<Buffer>) => {
  console.log(LendingReserveLayout.span);
  console.log(info.data.length);
  return info.data.length === LendingReserveLayout.span;
}

export interface LendingReserve {
  lastUpdateSlot: BN;

  lendingMarket: PublicKey;
  liquiditySupply: PublicKey;
  liquidityMint: PublicKey;
  collateralSupply: PublicKey;
  collateralMint: PublicKey;

  dexMarketOption: number;
  dexMarket: PublicKey;
  dexMarketPrice: BN; // what is precision on the price?

  config: {
    maxUtilizationRate: number,
    loanToValueRatio: number,
    liquidationBonus: number,
    liquidationThreshold: number,
  }
  // collateralFactor: number;

  cumulativeBorrowRate: BN;
  totalBorrows: BN;

  totalLiquidity: BN;
  collateralMintSupply: BN;

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
      instruction: LendingInstruction.InitReserve, // Init reserve instruction
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

    // NOTE: Why lending market needs to be a signer?
    { pubkey: lendingMarket, isSigner: true, isWritable: true },
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
      instruction: LendingInstruction.DepositReserveLiquidity,
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

export const withdrawInstruction = (
  collateralAmount: number | BN,
  from: PublicKey, // Collateral input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Liquidity output SPL Token account,
  reserveAccount: PublicKey,
  collateralMint: PublicKey,
  reserveSupply: PublicKey,
  authority: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("collateralAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.WithdrawReserveLiquidity,
      collateralAmount: new BN(collateralAmount),
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: reserveAccount, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: reserveSupply, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};

