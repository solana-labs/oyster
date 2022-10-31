import { PublicKey } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import { useMint } from '@oyster/common';
import BN from 'bn.js';

interface IMintFormatter {
  closestNumber: (value: string | number | BN) => BN;
  formatValue: (value: string | BN, asRaw?: boolean) => string;
  parseValue: (value: string) => BN;
}

const formatLamports = (
  value: string | number | BN | BigNumber,
  decimals: number,
): BigNumber => {
  let v = value;
  if (v instanceof BN) {
    v = v.toString();
  }
  return new BigNumber(v).shiftedBy(-decimals);
};

export const useMintFormatter = (
  mint: PublicKey | undefined,
): IMintFormatter => {
  const mintInfo = useMint(mint);
  const decimals = mintInfo?.decimals || 9;

  return {
    formatValue: (value, asRaw = false) => {
      const bn = formatLamports(value, decimals);
      return asRaw ? bn.toString() : bn.toFormat();
    },
    parseValue: value => {
      return new BN(
        formatLamports(value?.replace(',', '') ?? 0, -decimals).toString(),
      );
    },
    closestNumber: value => {
      const bn = formatLamports(
        formatLamports(value, decimals).integerValue(BigNumber.ROUND_CEIL),
        -decimals,
      );
      return new BN(bn.toString());
    },
  };
};
