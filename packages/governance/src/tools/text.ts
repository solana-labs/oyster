import { MintInfo } from '@solana/spl-token';
import BN from 'bn.js';
import { BigNumber } from 'bignumber.js';

export function formatTokenAmount(mint: MintInfo | undefined, amount: BN) {
  return mint
    ? new BigNumber(amount.toString()).shiftedBy(-mint.decimals).toFormat()
    : amount.toString();
}
