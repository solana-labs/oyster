import { AccountParser } from '@oyster/common';
import { parseObligation } from '@solana/spl-token-lending';
import { AccountInfo, PublicKey } from '@solana/web3.js';

export const ObligationParser: AccountParser = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const parsed = parseObligation(pubkey, info);
  if (parsed) {
    const { pubkey, info: account, data: info } = parsed;
    return { pubkey, account, info };
  }
};
