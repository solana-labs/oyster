import { useMemo } from "react";
import { useUserAccounts } from "./useUserAccounts";
import { useEnrichedLendingObligations } from "./useEnrichedLendingObligations";
import { TokenAccount } from "../models";

export function useUserObligations() {
  const { userAccounts } = useUserAccounts();
  const { obligations } = useEnrichedLendingObligations();

  const accountsByMint = useMemo(() => {
    return userAccounts.reduce((res, acc) => {
      const id = acc.info.mint.toBase58();
      res.set(id, [...(res.get(id) || []), acc]);
      return res;
    }, new Map<string, TokenAccount[]>());
  }, [userAccounts]);

  const userObligations = useMemo(() => {
    if (accountsByMint.size === 0) {
      return [];
    }

    return obligations
      .filter(
        (acc) => accountsByMint.get(acc.info.tokenMint.toBase58()) !== undefined
      )
      .map((ob) => {
        return {
          obligation: ob,
          userAccounts: [...accountsByMint.get(ob.info.tokenMint.toBase58())],
        };
      })
      .sort(
        (a, b) =>
          b.obligation.info.borrowedInQuote - a.obligation.info.borrowedInQuote
      );
  }, [accountsByMint, obligations]);

  return {
    userObligations,
    totalInQuote: userObligations.reduce(
      (result, item) => result + item.obligation.info.borrowedInQuote,
      0
    ),
  };
}
