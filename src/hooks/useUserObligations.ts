import { useMemo } from "react";
import { useUserAccounts } from "./useUserAccounts";
import { useLendingObligations } from "./useLendingObligations";
import { TokenAccount } from "../models";

export function useUserObligations() {
  const { userAccounts } = useUserAccounts();
  const { obligations } = useLendingObligations();

  const accountsByMint = useMemo(() => {
      return userAccounts.reduce((res, acc) => {
        const id = acc.info.mint.toBase58();
        res.set(id, [...(res.get(id) || []), acc]);
        return res;
      }, new Map<string, TokenAccount[]>())
    },
    [userAccounts]);

  const userObligations = useMemo(() => {
    if(accountsByMint.size === 0) {
      return [];
    }

    return obligations
      .filter((acc) => accountsByMint.get(acc.info.tokenMint.toBase58()) !== undefined)
      .map(ob => {
        return {
          oblication: ob,
          userAccounts: [...accountsByMint.get(ob.info.tokenMint.toBase58())],

          // TODO: add total borrowed amount?
        }
      });
  }, [accountsByMint, obligations]);


  return {
    userObligations
  };
}
