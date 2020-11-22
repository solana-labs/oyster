import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { LendingObligation, LendingObligationParser } from "../models/lending";
import { cache, ParsedAccount } from "./../contexts/accounts";

const getLendingObligations = () => {
  return cache
    .byParser(LendingObligationParser)
    .map((id) => cache.get(id))
    .filter((acc) => acc !== undefined) as any[];
};

export function useLendingObligations() {
  const [obligations, setObligations] = useState<
    ParsedAccount<LendingObligation>[]
  >([]);

  useEffect(() => {
    setObligations(getLendingObligations());

    const dispose = cache.emitter.onCache((args) => {
      if (args.parser === LendingObligationParser) {
        setObligations(getLendingObligations());
      }
    });

    return () => {
      dispose();
    };
  }, [setObligations]);

  return {
    obligations,
  };
}

export function useLendingObligation(address: string | PublicKey) {
  const id = typeof address === "string" ? address : address?.toBase58();
  const [obligationAccount, setObligationAccount] = useState<
    ParsedAccount<LendingObligation>
  >();

  useEffect(() => {
    setObligationAccount(cache.get(id));

    const dispose = cache.emitter.onCache((args) => {
      if (args.id === id) {
        setObligationAccount(cache.get(id));
      }
    });

    return () => {
      dispose();
    };
  }, [id, setObligationAccount]);

  return obligationAccount;
}
