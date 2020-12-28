import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { LendingReserve, LendingReserveParser } from "../models/lending";
import { cache, ParsedAccount } from "./../contexts/accounts";

export const getLendingReserves = () => {
  return cache
    .byParser(LendingReserveParser)
    .map((id) => cache.get(id))
    .filter((acc) => acc !== undefined) as ParsedAccount<LendingReserve>[];
};

export function useLendingReserves() {
  const [reserveAccounts, setReserveAccounts] = useState<
    ParsedAccount<LendingReserve>[]
  >(getLendingReserves());

  useEffect(() => {
    const dispose = cache.emitter.onCache((args) => {
      if (args.parser === LendingReserveParser) {
        setReserveAccounts(getLendingReserves());
      }
    });

    return () => {
      dispose();
    };
  }, [setReserveAccounts]);

  return {
    reserveAccounts,
  };
}

export function useLendingReserve(address?: string | PublicKey) {
  const id = useMemo(() => typeof address === "string" ? address : address?.toBase58(), [address]);
  const [reserveAccount, setReserveAccount] = useState<
    ParsedAccount<LendingReserve>
  >(cache.get(id || "") as ParsedAccount<LendingReserve>);

  useEffect(() => {
    const dispose = cache.emitter.onCache((args) => {
      if (args.id === id) {
        setReserveAccount(cache.get(id) as ParsedAccount<LendingReserve>);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setReserveAccount]);

  return reserveAccount;
}
