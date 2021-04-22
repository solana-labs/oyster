import { contexts, ParsedAccount } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { Obligation, ObligationParser } from '../models';

const { cache } = contexts.Accounts;

const getLendingObligations = () => {
  return cache
    .byParser(ObligationParser)
    .map(id => cache.get(id))
    .filter(acc => acc !== undefined) as ParsedAccount<Obligation>[];
};

export function useLendingObligations() {
  const [obligations, setObligations] = useState(getLendingObligations());

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.parser === ObligationParser) {
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

export function useLendingObligation(address?: string | PublicKey) {
  const id = typeof address === 'string' ? address : address?.toBase58();
  const [obligationAccount, setObligationAccount] = useState(
    cache.get(id || '') as ParsedAccount<Obligation>,
  );

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.id === id) {
        setObligationAccount(cache.get(id) as ParsedAccount<Obligation>);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setObligationAccount]);

  return obligationAccount;
}
