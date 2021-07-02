import { contexts, ParsedAccount } from '@oyster/common';
import { Obligation } from '@solana/spl-token-lending';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { ObligationParser } from '../models';

const { cache } = contexts.Accounts;

const getObligations = () => {
  return cache
    .byParser(ObligationParser)
    .map(id => cache.get(id))
    .filter(acc => acc !== undefined) as ParsedAccount<Obligation>[];
};

export function useObligations() {
  const [obligations, setObligations] = useState(getObligations());

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.parser === ObligationParser) {
        setObligations(getObligations());
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

export function useObligation(address: string | PublicKey) {
  const id = typeof address === 'string' ? address : address.toBase58();
  const [obligation, setObligation] = useState(
    cache.get(id || '') as ParsedAccount<Obligation>,
  );

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.id === id) {
        setObligation(cache.get(id) as ParsedAccount<Obligation>);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setObligation]);

  return obligation;
}
