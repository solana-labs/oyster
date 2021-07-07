import { AccountParser, wadToLamports } from '@oyster/common';
import { parseReserve, Reserve } from '@solana/spl-token-lending';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export const ReserveParser: AccountParser = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const parsed = parseReserve(pubkey, info);
  if (parsed) {
    const { pubkey, info: account, data: info } = parsed;
    return { pubkey, account, info };
  }
};

export const calculateUtilizationRatio = (reserve: Reserve) => {
  const totalBorrows = wadToLamports(
    reserve.liquidity.borrowedAmountWads,
  ).toNumber();
  const currentUtilization =
    totalBorrows /
    (reserve.liquidity.availableAmount.toNumber() + totalBorrows);

  return currentUtilization;
};

export const reserveMarketCap = (reserve?: Reserve) => {
  const available = reserve?.liquidity.availableAmount.toNumber() || 0;
  const borrowed = wadToLamports(
    reserve?.liquidity.borrowedAmountWads,
  ).toNumber();
  const total = available + borrowed;
  return total;
};

export const collateralExchangeRate = (reserve?: Reserve) => {
  return (
    (reserve?.collateral.mintTotalSupply.toNumber() || 1) /
    reserveMarketCap(reserve)
  );
};

export const collateralToLiquidity = (
  collateralAmount: BN | number,
  reserve?: Reserve,
) => {
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
  const amount =
    typeof liquidityAmount === 'number'
      ? liquidityAmount
      : liquidityAmount.toNumber();
  return Math.floor(amount * collateralExchangeRate(reserve));
};

// deposit APY utilization currentUtilizationRate * borrowAPY

export const calculateBorrowAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);
  const optimalUtilization = reserve.config.optimalUtilizationRate / 100;

  let borrowAPY;
  if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
    const normalizedFactor = currentUtilization / optimalUtilization;
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const minBorrowRate = reserve.config.minBorrowRate / 100;
    borrowAPY =
      normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
  } else {
    const normalizedFactor =
      (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const maxBorrowRate = reserve.config.maxBorrowRate / 100;
    borrowAPY =
      normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
      optimalBorrowRate;
  }

  return borrowAPY;
};

export const calculateDepositAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve);

  const borrowAPY = calculateBorrowAPY(reserve);
  return currentUtilization * borrowAPY;
};

