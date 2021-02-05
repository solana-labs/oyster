import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { LendingReserve, LendingReserveParser } from "../models/lending";
import { cache, ParsedAccount } from "./../contexts/accounts";
import { useConnectionConfig } from "./../contexts/connection";
import { getTokenByName, KnownToken } from "../utils/utils";

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
  const { tokenMap } = useConnectionConfig();
  const { reserveAccounts } = useLendingReserves();
  let addressName = address;
  if (typeof address === "string") {
    const token: KnownToken | null = getTokenByName(tokenMap, address);
    if (token) {
      const account = reserveAccounts.filter(
        (acc) => acc.info.liquidityMint.toBase58() === token.mintAddress
      )[0];
      if (account) {
        addressName = account.pubkey;
      }
    }
  }
  const id = useMemo(
    () =>
      typeof addressName === "string" ? addressName : addressName?.toBase58(),
    [addressName]
  );

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
