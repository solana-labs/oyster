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
import { wadToLamports } from "../../utils/utils";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";

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
    BufferLayout.u32("dexMarketOption"),
    Layout.publicKey("dexMarket"),

    BufferLayout.struct(
      [
        /// Optimal utilization rate as a percent
        BufferLayout.u8("optimalUtilizationRate"),
        /// The ratio of the loan to the value of the collateral as a percent
        BufferLayout.u8("loanToValueRatio"),
        /// The percent discount the liquidator gets when buying collateral for an unhealthy obligation
        BufferLayout.u8("liquidationBonus"),
        /// The percent at which an obligation is considered unhealthy
        BufferLayout.u8("liquidationThreshold"),
        /// Min borrow APY
        BufferLayout.u8("minBorrowRate"),
        /// Optimal (utilization) borrow APY
        BufferLayout.u8("optimalBorrowRate"),
        /// Max borrow APY
        BufferLayout.u8("maxBorrowRate"),
      ],
      "config"
    ),

    Layout.uint128("cumulativeBorrowRateWad"),
    Layout.uint128("borrowedLiquidityWad"),

    Layout.uint64("availableLiquidity"),
    Layout.uint64("collateralMintSupply"),
  ]
);

export const isLendingReserve = (info: AccountInfo<Buffer>) => {
  console.log(LendingReserveLayout.span);
  console.log(info.data.length);
  return info.data.length === LendingReserveLayout.span;
};

export interface LendingReserve {
  lastUpdateSlot: BN;

  lendingMarket: PublicKey;
  liquiditySupply: PublicKey;
  liquidityMint: PublicKey;
  collateralSupply: PublicKey;
  collateralMint: PublicKey;

  dexMarketOption: number;
  dexMarket: PublicKey;

  config: {
    optimalUtilizationRate: number;
    loanToValueRatio: number;
    liquidationBonus: number;
    liquidationThreshold: number;
    minBorrowRate: number;
    optimalBorrowRate: number;
    maxBorrowRate: number;
  };

  cumulativeBorrowRateWad: BN;
  borrowedLiquidityWad: BN;

  availableLiquidity: BN;
  collateralMintSupply: BN;
}

export const LendingReserveParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>
) => {
  const buffer = Buffer.from(info.data);
  const data = LendingReserveLayout.decode(buffer);
  if (data.lastUpdateSlot.toNumber() === 0) return;

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

  dexMarket: PublicKey // TODO: optional
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
    BufferLayout.u8("maxUtilizationRate"),
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

export const calculateUtilizationRatio = (reserve: LendingReserve) => {
  let borrowedLiquidity = wadToLamports(
    reserve.borrowedLiquidityWad
  ).toNumber();
  return (
    borrowedLiquidity /
    (reserve.availableLiquidity.toNumber() + borrowedLiquidity)
  );
};

export const reserveMarketCap = (reserve?: LendingReserve) => {
  const available = reserve?.availableLiquidity.toNumber() || 0;
  const borrowed = wadToLamports(reserve?.borrowedLiquidityWad).toNumber();
  const total = available + borrowed;

  return total;
};

export const collateralExchangeRate = (reserve?: LendingReserve) => {
  return (reserve?.collateralMintSupply.toNumber() || 1) / reserveMarketCap(reserve);
}

export const collateralToLiquidity = (collateralAmount: BN, reserve?: LendingReserve) => {
  return Math.floor(collateralAmount.toNumber() / collateralExchangeRate(reserve));
}


export const liquidityToCollateral = (liquidityAmount: BN, reserve?: LendingReserve) => {
  return Math.floor(liquidityAmount.toNumber() * collateralExchangeRate(reserve));
}
