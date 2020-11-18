import { PublicKey } from "@solana/web3.js";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LendingReserve, LendingReserveParser } from "../models/lending";
import { cache, ParsedAccount } from './../contexts/accounts';

const getLendingReserves = () => {
  return cache.byParser(LendingReserveParser).map(id => cache.get(id)).filter(acc => acc !== undefined) as any[];
};

export function useLendingReserves() {
  const [reserveAccounts, setReserveAccounts] = useState<ParsedAccount<LendingReserve>[]>([]);

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

export function useLendingReserve(address: string | PublicKey) {
  const id = typeof address === 'string' ? address : address?.toBase58();
  const [reserveAccount, setReserveAccount] = useState<ParsedAccount<LendingReserve>>();

  useEffect(() => {
    setReserveAccount(cache.get(id));

    const dispose = cache.emitter.onCache((args) => {
      if (args.id === id) {
        setReserveAccount(cache.get(id));
      }
    });

    return () => {
      dispose();
    };
  }, [setReserveAccount])

  return reserveAccount;
}