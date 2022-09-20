import { PublicKey } from '@solana/web3.js';
import { useMint } from '../contexts';

export function useMintTokenName(mint: PublicKey) {
  const mintInfo = useMint(mint);

  return {};
}
