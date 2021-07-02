import { KnownTokenMap, TokenAccount, utils } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import BigNumber from 'bignumber.js';
import { PoolInfo } from '../models';

const ZERO = new BigNumber(0);
const WAD = new BigNumber('1e+18');

export function getPoolName(
  map: KnownTokenMap,
  pool: PoolInfo,
  shorten = true,
) {
  const sorted = pool.pubkeys.holdingMints.map(a => a.toBase58()).sort();
  return sorted.map(item => utils.getTokenName(map, item, shorten)).join('/');
}

export function wadToLamports(amount?: BigNumber): BigNumber {
  return amount?.div(WAD) || ZERO;
}

export function fromLamports(
  account?: TokenAccount | number | BigNumber,
  mint?: MintInfo,
  rate: number = 1.0,
): number {
  if (!account) {
    return 0;
  }

  const amount = Math.floor(
    typeof account === 'number'
      ? account
      : BigNumber.isBigNumber(account)
      ? account.toNumber()
      : account.info.amount.toNumber(),
  );

  const precision = Math.pow(10, mint?.decimals || 0);
  return (amount / precision) * rate;
}
