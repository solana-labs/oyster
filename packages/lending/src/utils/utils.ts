import { TokenAccount } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import BigNumber from 'bignumber.js';

const WAD = new BigNumber('1e+18');

export function wadToLamports(amount: BigNumber) {
  return amount.div(WAD);
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
