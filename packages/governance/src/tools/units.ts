import { MintInfo } from '@solana/spl-token';
import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';

export function getTimestampDays(unixTimestamp: number) {
  return unixTimestamp / 86400;
}

export function getMintDisplayAmount(mint: MintInfo, amount: BN) {
  return new BigNumber(amount.toString()).shiftedBy(-mint.decimals).toFormat();
}
