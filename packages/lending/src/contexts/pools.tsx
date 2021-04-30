import React, { useContext, useMemo } from 'react';

import { PoolInfo } from '../models';

const AccountsContext = React.createContext<any>(null);

export function useCachedPool(legacy = false) {
  const context = useContext(AccountsContext);

  const allPools = context.pools as PoolInfo[];
  const pools = useMemo(() => {
    return allPools.filter(p => p.legacy === legacy);
  }, [allPools, legacy]);

  return {
    pools,
  };
}
