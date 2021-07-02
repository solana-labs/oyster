import { contexts, getTokenByName, ParsedAccount } from '@oyster/common';
import { Reserve } from '@solana/spl-token-lending';
import { TokenInfo } from '@solana/spl-token-registry';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import { ReserveParser } from '../models';

const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

const getReserves = () => {
  return cache
    .byParser(ReserveParser)
    .map(id => cache.get(id))
    .filter(acc => acc !== undefined) as ParsedAccount<Reserve>[];
};

export function useReserves() {
  const [reserves, setReserves] = useState<ParsedAccount<Reserve>[]>(
    getReserves(),
  );

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.parser === ReserveParser) {
        setReserves(getReserves());
      }
    });

    return () => {
      dispose();
    };
  }, [setReserves]);

  return {
    reserves,
  };
}

export function useReserve(address: string | PublicKey) {
  const { tokenMap } = useConnectionConfig();
  const { reserves } = useReserves();
  if (typeof address === 'string') {
    const token: TokenInfo | null = getTokenByName(tokenMap, address);
    if (token) {
      const account = reserves.filter(
        acc => acc.info.liquidity.mintPubkey.toBase58() === token.address,
      )[0];
      if (account) {
        address = account.pubkey;
      }
    }
  }
  const id = useMemo(
    () => (typeof address === 'string' ? address : address.toBase58()),
    [address],
  );

  const [reserve, setReserve] = useState<ParsedAccount<Reserve>>(
    cache.get(id || '') as ParsedAccount<Reserve>,
  );

  useEffect(() => {
    const dispose = cache.emitter.onCache(args => {
      if (args.id === id) {
        setReserve(cache.get(id) as ParsedAccount<Reserve>);
      }
    });

    return () => {
      dispose();
    };
  }, [id, setReserve]);

  return reserve;
}
