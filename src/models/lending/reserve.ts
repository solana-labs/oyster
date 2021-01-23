import {
  AccountInfo,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { TOKEN_PROGRAM_ID, LENDING_PROGRAM_ID } from "../../utils/ids";
import { wadToLamports } from "../../utils/utils";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";

export const LendingReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("version"),
    Layout.uint64("lastUpdateSlot"),

    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMint"),
    BufferLayout.u8("liquidityMintDecimals"),
    Layout.publicKey("liquiditySupply"),
    Layout.publicKey("collateralMint"),
    Layout.publicKey("collateralSupply"),

    Layout.publicKey("collateralFeesReceiver"),

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

        BufferLayout.struct(
          [
            /// Fee assessed on `BorrowReserveLiquidity`, expressed as a Wad.
            /// Must be between 0 and 10^18, such that 10^18 = 1.  A few examples for
            /// clarity:
            /// 1% = 10_000_000_000_000_000
            /// 0.01% (1 basis point) = 100_000_000_000_000
            /// 0.00001% (Aave borrow fee) = 100_000_000_000
            Layout.uint64("borrowFeeWad"),

            /// Amount of fee going to host account, if provided in liquidate and repay
            BufferLayout.u8("hostFeePercentage"),
          ],
          "fees"
        ),
      ],
      "config"
    ),

    BufferLayout.struct(
      [
        Layout.uint128("cumulativeBorrowRateWad"),
        Layout.uint128("borrowedLiquidityWad"),
        Layout.uint64("availableLiquidity"),
        Layout.uint64("collateralMintSupply"),
      ],
      "state"
    ),

    // extra space for future contract changes
    BufferLayout.blob(300, "padding"),
  ]
);

export const isLendingReserve = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingReserveLayout.span;
};

export interface LendingReserve {
  version: number;

  lastUpdateSlot: BN;

  lendingMarket: PublicKey;
  liquiditySupply: PublicKey;
  liquidityMint: PublicKey;
  collateralMint: PublicKey;
  collateralSupply: PublicKey;
  collateralFeesReceiver: PublicKey;

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

    fees: {
      borrowFeeWad: BN;
      hostFeePercentage: number;
    };
  };

  state: {
    cumulativeBorrowRateWad: BN;
    borrowedLiquidityWad: BN;

    availableLiquidity: BN;
    collateralMintSupply: BN;
  };
}

export const LendingReserveParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>
) => {
  const buffer = Buffer.from(info.data);
  const data = LendingReserveLayout.decode(buffer) as LendingReserve;

  if (data.lastUpdateSlot.toNumber() === 0) {
    return;
  }

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
  transferAuthority: PublicKey,

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
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
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

export const accrueInterestInstruction = (
  ...reserveAccount: PublicKey[]
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.AccrueReserveInterest,
    },
    data
  );

  const keys = [
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ...reserveAccount.map((reserve) => ({
      pubkey: reserve,
      isSigner: false,
      isWritable: true,
    })),
  ];
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};

export const calculateUtilizationRatio = (reserve: LendingReserve) => {
  const totalBorrows = wadToLamports(
    reserve.state.borrowedLiquidityWad
  ).toNumber();
  const currentUtilization =
    totalBorrows / (reserve.state.availableLiquidity.toNumber() + totalBorrows);

  return currentUtilization;
};

export const reserveMarketCap = (reserve?: LendingReserve) => {
  const available = reserve?.state.availableLiquidity.toNumber() || 0;
  const borrowed = wadToLamports(
    reserve?.state.borrowedLiquidityWad
  ).toNumber();
  const total = available + borrowed;

  return total;
};

export const collateralExchangeRate = (reserve?: LendingReserve) => {
  return (
    (reserve?.state.collateralMintSupply.toNumber() || 1) /
    reserveMarketCap(reserve)
  );
};

export const collateralToLiquidity = (
  collateralAmount: BN | number,
  reserve?: LendingReserve
) => {
  const amount =
    typeof collateralAmount === "number"
      ? collateralAmount
      : collateralAmount.toNumber();
  return Math.floor(amount / collateralExchangeRate(reserve));
};

export const liquidityToCollateral = (
  liquidityAmount: BN | number,
  reserve?: LendingReserve
) => {
  const amount =
    typeof liquidityAmount === "number"
      ? liquidityAmount
      : liquidityAmount.toNumber();
  return Math.floor(amount * collateralExchangeRate(reserve));
};
