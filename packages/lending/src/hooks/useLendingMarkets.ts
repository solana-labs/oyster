import { contexts, ParsedAccount } from '@oyster/common';
import { LendingMarket } from '@solana/spl-token-lending';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { LendingMarketParser } from '../models';

const { cache } = contexts.Accounts;

const getLendingMarkets = () => {
  return cache
    .byParser(LendingMarketParser)
    .map(id => cache.get(id))
    .filter(acc => acc !== undefined) as any[];
};

export function useLendingMarkets() {
  const [lendingMarkets, setLendingMarkets] = useState<
    ParsedAccount<LendingMarket>[]
  >(getLendingMarkets());

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.parser === LendingMarketParser) {
        setLendingMarkets(getLendingMarkets());
      }
    });

    return () => {
      dispose();
    };
  }, [setLendingMarkets]);

  return {
    lendingMarkets,
  };
}

export function useLendingMarket(address: string | PublicKey) {
  const id = typeof address === 'string' ? address : address.toBase58();
  const [lendingMarket, setLendingMarket] = useState<
    ParsedAccount<LendingMarket>
  >(cache.get(id || '') as ParsedAccount<LendingMarket>);

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.id === id) {
        setLendingMarket(cache.get(id) as ParsedAccount<LendingMarket>);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setLendingMarket]);

  return lendingMarket;
}
