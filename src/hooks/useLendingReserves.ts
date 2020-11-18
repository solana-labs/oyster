import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LendingReserveParser } from "../models/lending";
import { cache } from './../contexts/accounts';

const getLendingReserves = () => {
  return cache.byParser(LendingReserveParser).map(id => cache.get(id)).filter(acc => acc !== undefined) as any[];
};

export function useLendingReserves() {
  const [reserveAccounts, setReserveAccounts] = useState<any[]>([]);

  useEffect(() => {
    setReserveAccounts(getLendingReserves());

    const dispose = cache.emitter.onCache((args) => {
      if (args.parser === LendingReserveParser) {
        setReserveAccounts(getLendingReserves());
      }
    });

    return () => {
      dispose();
    };
  }, [setReserveAccounts])

  return {
    reserveAccounts,
  };
}