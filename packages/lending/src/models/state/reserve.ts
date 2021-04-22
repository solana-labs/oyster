import { wadToLamports } from '@oyster/common';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';
import { LastUpdate } from './lastUpdate';

export const ReserveLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),

    BufferLayout.struct(
      [Layout.uint64('lastUpdateSlot'), BufferLayout.u8('lastUpdateStale')],
      'lastUpdate',
    ),

    Layout.publicKey('lendingMarket'),

    BufferLayout.struct(
      [
        Layout.publicKey('liquidityMint'),
        BufferLayout.u8('liquidityMintDecimals'),
        Layout.publicKey('liquiditySupply'),
        Layout.publicKey('liquidityFeeReceiver'),
        Layout.uint128('cumulativeBorrowRateWads'),
        Layout.uint128('borrowedAmountWads'),
        Layout.uint64('availableAmount'),
      ],
      'liquidity',
    ),

    BufferLayout.struct(
      [
        Layout.publicKey('collateralMint'),
        Layout.uint64('collateralMintAmount'),
        Layout.publicKey('collateralSupply'),
      ],
      'collateral',
    ),

    // TODO: replace u32 option with generic equivalent
    BufferLayout.u32('aggregatorOption'),
    Layout.publicKey('aggregator'),

    BufferLayout.struct(
      [
        BufferLayout.u8('optimalUtilizationRate'),
        BufferLayout.u8('loanToValueRatio'),
        BufferLayout.u8('liquidationBonus'),
        BufferLayout.u8('liquidationThreshold'),
        BufferLayout.u8('minBorrowRate'),
        BufferLayout.u8('optimalBorrowRate'),
        BufferLayout.u8('maxBorrowRate'),
        BufferLayout.struct(
          [Layout.uint64('borrowFeeWad'), BufferLayout.u8('hostFeePercentage')],
          'fees',
        ),
      ],
      'config',
    ),

    // extra space for future contract changes
    BufferLayout.blob(256, 'padding'),
  ],
);

export const isReserve = (info: AccountInfo<Buffer>) => {
  return info.data.length === ReserveLayout.span;
};

export interface Reserve {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  liquidity: ReserveLiquidity;
  collateral: ReserveCollateral;
  config: ReserveConfig;
}

export interface ReserveLiquidity {
  mint: PublicKey;
  mintDecimals: number;
  supply: PublicKey;
  feeReceiver: PublicKey;

  // @FIXME: aggregator option
  aggregatorOption: number;
  aggregator: PublicKey;

  cumulativeBorrowRateWads: BN;
  marketPrice: BN;
  availableAmount: BN;
  borrowedAmountWads: BN;
}

export interface ReserveCollateral {
  mint: PublicKey;
  mintAmount: BN;
  supply: PublicKey;
}

// @FIXME: use BigNumber
export interface ReserveConfig {
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
}

export const ReserveParser = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
  const buffer = Buffer.from(info.data);
  const reserve = ReserveLayout.decode(buffer) as Reserve;

  if (reserve.lastUpdate.slot.isZero()) {
    return;
  }

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: reserve,
  };

  return details;
};

export const calculateUtilizationRatio = (reserve: Reserve) => {
  // @FIXME: use BigNumber
  const totalBorrows = wadToLamports(
    reserve.liquidity.borrowedAmountWads,
  ).toNumber();
  const currentUtilization =
    totalBorrows /
    (reserve.liquidity.availableAmount.toNumber() + totalBorrows);

  return currentUtilization;
};

export const reserveMarketCap = (reserve?: Reserve) => {
  // @FIXME: use BigNumber
  const available = reserve?.liquidity.availableAmount.toNumber() || 0;
  const borrowed = wadToLamports(
    reserve?.liquidity.borrowedAmountWads,
  ).toNumber();
  const total = available + borrowed;

  return total;
};

export const collateralExchangeRate = (reserve?: Reserve) => {
  // @FIXME: use BigNumber
  return (
    (reserve?.collateral.mintAmount.toNumber() || 1) / reserveMarketCap(reserve)
  );
};

export const collateralToLiquidity = (
  collateralAmount: BN | number,
  reserve?: Reserve,
) => {
  // @FIXME: use BigNumber
  const amount =
    typeof collateralAmount === 'number'
      ? collateralAmount
      : collateralAmount.toNumber();
  return Math.floor(amount / collateralExchangeRate(reserve));
};

export const liquidityToCollateral = (
  liquidityAmount: BN | number,
  reserve?: Reserve,
) => {
  // @FIXME: use BigNumber
  const amount =
    typeof liquidityAmount === 'number'
      ? liquidityAmount
      : liquidityAmount.toNumber();
  return Math.floor(amount * collateralExchangeRate(reserve));
};
