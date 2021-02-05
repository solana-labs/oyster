import { PublicKey } from "@solana/web3.js";

interface PoolAirdrop {
  pool: PublicKey;
  airdrops: {
    mint: PublicKey;
    amount: number;
  }[];
}

export const POOLS_WITH_AIRDROP: PoolAirdrop[] = [];
