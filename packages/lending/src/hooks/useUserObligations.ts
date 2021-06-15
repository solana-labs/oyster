import { hooks, TokenAccount } from '@oyster/common';
import { useMemo } from 'react';
import { useEnrichedLendingObligations } from './useEnrichedLendingObligations';

const { useUserAccounts } = hooks;

export function useUserObligations() {
  const { userAccounts } = useUserAccounts();
  const { obligations } = useEnrichedLendingObligations();

  // @FIXME: obligation tokens were removed, simplify this
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

    // @FIXME: obligation tokens were removed, simplify this
    return obligations
      .map(ob => {
        return {
          obligation: ob,
          userAccounts: [],
        };
      })
      .sort(
        (a, b) =>
          b.obligation.info.borrowedInQuote - a.obligation.info.borrowedInQuote,
      );
  }, [accountsByMint, obligations]);

  return {
    userObligations,
    totalInQuote: userObligations.reduce(
      (result, item) => result + item.obligation.info.borrowedInQuote,
      0,
    ),
  };
}
