import { AccountInfo, PublicKey } from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';

export interface LendingMarket {
  version: number;
  isInitialized: boolean;
  quoteCurrency: Buffer;
  tokenProgramId: PublicKey;
}

export const LendingMarketLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    BufferLayout.u8('bumpSeed'),
    Layout.publicKey('owner'),
    BufferLayout.blob(32, 'quoteCurrency'),
    Layout.publicKey('tokenProgramId'),
    Layout.publicKey('oracleProgramId'),
    BufferLayout.blob(128, 'padding'),
  ],
);

export const isLendingMarket = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingMarketLayout.span;
};

export const LendingMarketParser = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const lendingMarket = LendingMarketLayout.decode(buffer) as LendingMarket;

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: lendingMarket,
  };

  return details;
};
