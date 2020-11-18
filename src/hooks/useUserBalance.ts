import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useMint } from "../contexts/accounts";
import { convert } from "../utils/utils";
import { useUserAccounts } from "./useUserAccounts";

export function useUserBalance(mint?: PublicKey) {
  const { userAccounts } = useUserAccounts();

  const mintInfo = useMint(mint);

  return useMemo(() =>
    convert(userAccounts
      .filter(acc => mint?.equals(acc.info.mint))
      .reduce((res, item) => res += item.info.amount.toNumber(), 0)
      , mintInfo),
    [userAccounts]);
}