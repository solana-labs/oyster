import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useMint } from "../contexts/accounts";
import { fromLamports } from "../utils/utils";
import { useUserAccounts } from "./useUserAccounts";

export function useUserBalance(mint?: PublicKey, account?: PublicKey) {
  const { userAccounts } = useUserAccounts();
  const mintInfo = useMint(mint);
  const accounts = useMemo(() => {
    return userAccounts
      .filter(
        (acc) =>
          mint?.equals(acc.info.mint) &&
          (!account || account.equals(acc.pubkey))
      )
      .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());
  }, [userAccounts, mint, account]);

  const balanceLamports = useMemo(() => {
    return accounts.reduce(
      (res, item) => (res += item.info.amount.toNumber()),
      0
    );
  }, [accounts]);

  return {
    balance: fromLamports(balanceLamports, mintInfo),
    balanceLamports,
    accounts,
  };
}
