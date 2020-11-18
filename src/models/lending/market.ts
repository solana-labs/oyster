import {
  AccountInfo,
  PublicKey,
} from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import * as Layout from "./../../utils/layout";

export const LendingMarketLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
      BufferLayout.u8("isInitialized"),
      Layout.publicKey("quoteMint"),
  ]
);

export interface LendingMarket {
  isInitialized: boolean;
  quoteMint: PublicKey;
}

export const isLendingMarket = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingMarketLayout.span;
}

export const LendingMarketParser = (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
  const buffer = Buffer.from(info.data);
  const data = LendingMarketLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: data,
  };

  return details;
};


// TODO:
// create instructions for init, deposit and withdraw