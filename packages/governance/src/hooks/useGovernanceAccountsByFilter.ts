import {
  utils,
  ParsedAccount,
  useConnectionConfig,
  useConnection,
} from '@oyster/common';

import { useEffect, useState } from 'react';
import { getAccountTypes, GovernanceAccountClass } from '../models/accounts';
import { BorshAccountParser } from '../models/serialisation';
import { MemcmpFilter, getGovernanceAccounts } from '../utils/api';

// Fetches Governance program accounts using the given filter and subscribes to updates
export function useGovernanceAccountsByFilter<TAccount>(
  accountClass: GovernanceAccountClass,
  filters: (MemcmpFilter | undefined)[],
) {
  const [accounts, setAccounts] = useState<
    Record<string, ParsedAccount<TAccount>>
  >({});

  const { endpoint } = useConnectionConfig();
  const connection = useConnection();

  // Use stringify to get stable dependency for useEffect to  ensure we load the initial snapshot of accounts only once
  // If it causes performance issues then we should use object compare logic https://stackoverflow.com/questions/53601931/custom-useeffect-second-argument
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    if (filters.some(f => !f)) {
      return;
    }

    const queryFilters = filters.map(f => f!);
    const accountTypes = getAccountTypes(accountClass);

    const sub = (async () => {
      // TODO: add retries
      const loadedAccounts = await getGovernanceAccounts<TAccount>(
        endpoint,
        accountClass,
        accountTypes,
        queryFilters,
      );
      setAccounts(loadedAccounts);

      const { governance } = utils.programIds();

      return connection.onProgramAccountChange(governance.programId, info => {
        if (accountTypes.some(at => info.accountInfo.data[0] === at)) {
          const isMatch = !queryFilters.some(
            f => !f.isMatch(info.accountInfo.data),
          );
          const base58Key = info.accountId.toBase58();

          const account = BorshAccountParser(accountClass)(
            info.accountId,
            info.accountInfo,
          ) as ParsedAccount<TAccount>;

          setAccounts((acts: any) => {
            if (isMatch) {
              return {
                ...acts,
                [base58Key]: account,
              };
            } else if (acts[base58Key]) {
              return {
                ...Object.keys(acts)
                  .filter(k => k !== base58Key)
                  .reduce((res, key) => {
                    res[key] = acts[key];
                    return res;
                  }, {} as any),
              };
            } else {
              return acts;
            }
          });
        }
      });
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, connection, endpoint]);

  return Object.values(accounts);
}
