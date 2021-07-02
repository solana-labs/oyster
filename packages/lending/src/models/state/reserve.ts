import { AccountParser } from '@oyster/common';
import { parseReserve, Reserve } from '@solana/spl-token-lending';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { wadToLamports } from '../../utils/utils';

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
  const borrowedAmount = wadToLamports(reserve.liquidity.borrowedAmountWads);
  const availableAmount = new BigNumber(
    reserve.liquidity.availableAmount.toString(),
  );
  return borrowedAmount.div(availableAmount.plus(borrowedAmount));
};

export const reserveMarketCap = (reserve: Reserve) => {
  const availableAmount = new BigNumber(
    reserve.liquidity.availableAmount.toString(),
  );
  const borrowedAmount = wadToLamports(reserve.liquidity.borrowedAmountWads);
  return availableAmount.plus(borrowedAmount);
};

export const collateralExchangeRate = (reserve: Reserve) => {
  const marketCap = reserveMarketCap(reserve);
  return new BigNumber(reserve.collateral.mintTotalSupply.toString()).div(
    marketCap,
  );
};

export const collateralToLiquidity = (
  collateralAmount: number | bigint | BigNumber,
  reserve: Reserve,
) => {
  const amount = BigNumber.isBigNumber(collateralAmount)
    ? collateralAmount
    : new BigNumber(collateralAmount.toString());
  const exchangeRate = collateralExchangeRate(reserve);
  return amount.div(exchangeRate);
};

export const liquidityToCollateral = (
  liquidityAmount: number | bigint | BigNumber,
  reserve: Reserve,
) => {
  const amount = BigNumber.isBigNumber(liquidityAmount)
    ? liquidityAmount
    : new BigNumber(liquidityAmount.toString());
  const exchangeRate = collateralExchangeRate(reserve);
  return amount.times(exchangeRate);
};

export const calculateBorrowAPY = (reserve: Reserve) => {
  const currentUtilization = calculateUtilizationRatio(reserve).toNumber();
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
  const currentUtilization = calculateUtilizationRatio(reserve).toNumber();
  const borrowAPY = calculateBorrowAPY(reserve);
  return currentUtilization * borrowAPY;
};
