import { MintInfo } from '@solana/spl-token';
import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';

import { MintMaxVoteWeightSource } from '../models/accounts';

const SECONDS_PER_DAY = 86400;

export function getDaysFromTimestamp(unixTimestamp: number) {
  return unixTimestamp / SECONDS_PER_DAY;
}

export function getTimestampFromDays(days: number) {
  return days * SECONDS_PER_DAY;
}

/// Formats mint amount (natural units) as a decimal string
export function formatMintNaturalAmountAsDecimal(
  mint: MintInfo,
  naturalAmount: BN,
) {
  return getMintDecimalAmountFromNatural(mint, naturalAmount).toFormat();
}

/// Formats mint supply (natural units) as a decimal string
export function formatMintSupplyAsDecimal(mint: MintInfo) {
  return getMintDecimalAmountFromNatural(mint, mint.supply).toFormat();
}

// Converts mint amount (natural units) to decimals
export function getMintDecimalAmountFromNatural(
  mint: MintInfo,
  naturalAmount: BN,
) {
  return new BigNumber(naturalAmount.toString()).shiftedBy(-mint.decimals);
}

// Parses input string in decimals to mint amount (natural units)
// If the input is already a number then converts it to mint natural amount
export function parseMintNaturalAmountFromDecimal(
  decimalAmount: string | number,
  mintDecimals: number,
) {
  if (typeof decimalAmount === 'number') {
    return getMintNaturalAmountFromDecimal(decimalAmount, mintDecimals);
  }

  if (mintDecimals === 0) {
    return parseInt(decimalAmount);
  }

  const floatAmount = parseFloat(decimalAmount);
  return getMintNaturalAmountFromDecimal(floatAmount, mintDecimals);
}

// Converts amount in decimals to mint amount (natural units)
export function getMintNaturalAmountFromDecimal(
  decimalAmount: number,
  decimals: number,
) {
  return new BigNumber(decimalAmount).shiftedBy(decimals).toNumber();
}

// Calculates percentage (provided as 0-100) of mint supply as decimal amount
export function getMintSupplyPercentageAsDecimal(
  mint: MintInfo,
  percentage: number,
) {
  return new BigNumber(mint.supply.mul(new BN(percentage)).toString())
    .shiftedBy(-(mint.decimals + 2))
    .toNumber();
}

// Calculates mint min amount as decimal
export function getMintMinAmountAsDecimal(mint: MintInfo) {
  return new BigNumber(1).shiftedBy(-mint.decimals).toNumber();
}

// Returns mint supply amount as decimal
export function getMintSupplyAsDecimal(mint: MintInfo) {
  return new BigNumber(mint.supply.toString())
    .shiftedBy(-mint.decimals)
    .toNumber();
}

// Calculates mint supply fraction for the given natural amount as decimal amount
export function getMintSupplyFractionAsDecimalPercentage(
  mint: MintInfo,
  naturalAmount: BN | number,
) {
  return getBigNumberAmount(naturalAmount)
    .multipliedBy(100)
    .dividedBy(new BigNumber(mint.supply.toString()))
    .toNumber();
}

// Calculates mint supply fraction for the given natural amount as decimal amount
export function getAmountFractionAsDecimalPercentage(
  totalNaturalAmount: BN | number,
  naturalAmount: BN | number,
) {
  return getBigNumberAmount(naturalAmount)
    .multipliedBy(100)
    .dividedBy(new BigNumber(getBigNumberAmount(totalNaturalAmount)))
    .toNumber();
}

// Converts BN or number to BigNumber
export function getBigNumberAmount(amount: BN | number) {
  return typeof amount === 'number'
    ? new BigNumber(amount)
    : new BigNumber(amount.toString());
}

// Formats percentage value showing it in human readable form
export function formatPercentage(percentage: number) {
  if (percentage === 0 || percentage === Infinity) {
    return '0%';
  }

  if (percentage < 0.01) {
    return '<0.01%';
  }

  return `${+percentage.toFixed(2)}%`;
}

// Returns amount vote weight for the given mint as percentage in decimals
export function getMintVoteWeight(mint: MintInfo, naturalAmount: BN) {
  return new BigNumber(100)
    .multipliedBy(getBigNumberAmount(naturalAmount))
    .div(getBigNumberAmount(mint.supply))
    .toNumber();
}

// Returns amount vote weight for the given mint as percentage in decimals
export function getMintSupplyVoteWeight(supply: BN, naturalAmount: BN) {
  return new BigNumber(100)
    .multipliedBy(getBigNumberAmount(naturalAmount))
    .div(getBigNumberAmount(supply))
    .toNumber();
}

export function formatMintVoteWeight(mint: MintInfo, naturalAmount: BN) {
  return formatPercentage(getMintVoteWeight(mint, naturalAmount));
}

export function formatMintSupplyFractionAsDecimalPercentage(
  mint: MintInfo,
  naturalAmount: BN | number,
) {
  return formatPercentage(
    getMintSupplyFractionAsDecimalPercentage(mint, naturalAmount),
  );
}

export function formatMintMaxVoteWeight(
  mint: MintInfo,
  maxVoteWeightSource: MintMaxVoteWeightSource,
) {
  const supplyFraction = maxVoteWeightSource.getSupplyFraction();

  return new BigNumber(supplyFraction.toString())
    .multipliedBy(mint.supply.toString())
    .shiftedBy(
      -(mint.decimals + MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS),
    )
    .toFormat(mint.decimals);
}

export function formatMintMaxVotePercentage(
  maxVoteWeightSource: MintMaxVoteWeightSource,
) {
  const supplyFraction = maxVoteWeightSource.getSupplyFraction();

  const percentage = new BigNumber(supplyFraction.toString())
    .shiftedBy(-(MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS - 2))
    .toNumber();

  if (percentage < 0.01) {
    return '<0.01%';
  }

  const rounded = +percentage.toFixed(2);
  return rounded === percentage ? `${rounded}%` : `~${rounded}%`;
}

export function getMintMaxVoteWeight(
  mint: MintInfo,
  maxVoteWeightSource: MintMaxVoteWeightSource,
) {
  if (maxVoteWeightSource.isFullSupply()) {
    return mint.supply;
  }

  const supplyFraction = maxVoteWeightSource.getSupplyFraction();

  const maxVoteWeight = new BigNumber(supplyFraction.toString())
    .multipliedBy(mint.supply.toString())
    .shiftedBy(-MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS);

  return new BN(maxVoteWeight.toString());
}
