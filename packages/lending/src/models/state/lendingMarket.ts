import { AccountParser } from '@oyster/common';
import { parseLendingMarket } from '@solana/spl-token-lending';
import { AccountInfo, PublicKey } from '@solana/web3.js';

export const LendingMarketParser: AccountParser = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const parsed = parseLendingMarket(pubkey, info);
  if (parsed) {
    const { pubkey, info: account, data: info } = parsed;
    return { pubkey, account, info };
  }
};
