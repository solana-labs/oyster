import { MARKETS, TOKEN_MINTS } from "@project-serum/serum";
import { PublicKey } from "@solana/web3.js";

// @FIXME: overrides should be limited to devnet

// use to override serum market to use specific mint
export const MINT_TO_MARKET: { [key: string]: string } = {
  // SOL/USDT
  "So11111111111111111111111111111111111111112": "8RJA4WhY2Ei48c4xANSgPoqw7DU7mRgvg6eqJS3tvLEN",
  // SRM/USDT
  "9FbAMDvXqNjPqZSYt4EWTguJuDrGkfvwr3gSFpiSbX9S": "CRLpSnSf7JkoJi9tUnz55R2FoTCrDDkWxQMU6uSVBQgc",
};

TOKEN_MINTS.length = 0;
TOKEN_MINTS.push(
  {
    address: new PublicKey("7KBVenLz5WNH4PA5MdGkJNpDDyNKnBQTwnz1UqJv9GUm"),
    name: "USDT",
  },
  {
    address: new PublicKey("9FbAMDvXqNjPqZSYt4EWTguJuDrGkfvwr3gSFpiSbX9S"),
    name: "SRM",
  },
  {
    address: new PublicKey("So11111111111111111111111111111111111111112"),
    name: "SOL",
  }
);

MARKETS.length = 0;
MARKETS.push(
  {
    address: new PublicKey("8RJA4WhY2Ei48c4xANSgPoqw7DU7mRgvg6eqJS3tvLEN"),
    name: "SOL/USDT",
    programId: new PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY"),
    deprecated: false,
  },
  {
    address: new PublicKey("CRLpSnSf7JkoJi9tUnz55R2FoTCrDDkWxQMU6uSVBQgc"),
    name: "SRM/USDT",
    programId: new PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY"),
    deprecated: false,
  }
);
