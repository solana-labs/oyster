import { PublicKey } from "@solana/web3.js";

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export let TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export let LENDING_PROGRAM_ID = new PublicKey(
  "TokenLend1ng1111111111111111111111111111111"
);

export const setProgramIds = (envName: string) => {
  // Add dynamic program ids
  if(envName === 'mainnet-beta') {
    LENDING_PROGRAM_ID = new PublicKey('2KfJP7pZ6QSpXa26RmsN6kKVQteDEdQmizLSvuyryeiW');
  }


};

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    lending: LENDING_PROGRAM_ID,
  };
};
