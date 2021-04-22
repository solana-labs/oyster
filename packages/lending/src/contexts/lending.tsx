import { contexts, LENDING_PROGRAM_ID, ParsedAccount } from '@oyster/common';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useLendingReserves } from '../hooks';
import {
  isLendingMarket,
  isObligation,
  isReserve,
  LendingMarketParser,
  ObligationParser,
  Reserve,
  ReserveParser,
} from '../models';
import { DexMarketParser } from '../models/dex';
import { usePrecacheMarket } from './market';

const { useConnection } = contexts.Connection;
const { cache, getMultipleAccounts, MintParser } = contexts.Accounts;

export interface LendingContextState {}

const LendingContext = React.createContext<LendingContextState | null>(null);

export function LendingProvider({ children = null as any }) {
  const { accounts } = useLending();
  return (
    <LendingContext.Provider
      value={{
        accounts,
      }}
    >
      {children}
    </LendingContext.Provider>
  );
}

export const useLending = () => {
  const connection = useConnection();
  const [lendingAccounts, setLendingAccounts] = useState<any[]>([]);
  const { reserveAccounts } = useLendingReserves();
  const precacheMarkets = usePrecacheMarket();

  // TODO: query for all the dex from reserves

  const processAccount = useCallback(
    (item: { pubkey: PublicKey; account: AccountInfo<Buffer> }) => {
      if (isReserve(item.account)) {
        const reserve = cache.add(
          item.pubkey.toBase58(),
          item.account,
          ReserveParser,
        );

        return reserve;
      } else if (isLendingMarket(item.account)) {
        return cache.add(
          item.pubkey.toBase58(),
          item.account,
          LendingMarketParser,
        );
      } else if (isObligation(item.account)) {
        return cache.add(
          item.pubkey.toBase58(),
          item.account,
          ObligationParser,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (reserveAccounts.length > 0) {
      precacheMarkets(
        reserveAccounts.map(reserve => reserve.info.liquidity.mint.toBase58()),
      );
    }
  }, [reserveAccounts, precacheMarkets]);

  // initial query
  useEffect(() => {
    setLendingAccounts([]);

    const queryLendingAccounts = async () => {
      const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID,
      );

      const accounts = programAccounts
        .map(processAccount)
        .filter(item => item !== undefined);

      const lendingReserves = accounts
        .filter(
          acc => (acc?.info as Reserve).lendingMarket !== undefined,
        )
        .map(acc => acc as ParsedAccount<Reserve>);

      const toQuery = [
        ...lendingReserves.map(acc => {
          const result = [
            cache.registerParser(
              acc?.info.collateral.mint.toBase58(),
              MintParser,
            ),
            cache.registerParser(
              acc?.info.liquidity.mint.toBase58(),
              MintParser,
            ),
            // ignore dex if its not set
            cache.registerParser(
              acc?.info.liquidity.aggregatorOption ? acc?.info.liquidity.aggregator.toBase58() : '',
              DexMarketParser,
            ),
          ].filter(_ => _);
          return result;
        }),
      ].flat() as string[];

      // This will pre-cache all accounts used by pools
      // All those accounts are updated whenever there is a change
      await getMultipleAccounts(connection, toQuery, 'single').then(
        ({ keys, array }) => {
          return array.map((obj, index) => {
            const address = keys[index];
            cache.add(address, obj);
            return obj;
          }) as any[];
        },
      );

      // HACK: fix, force account refresh
      programAccounts.map(processAccount).filter(item => item !== undefined);

      return accounts;
    };

    Promise.all([queryLendingAccounts()]).then(all => {
      setLendingAccounts(all.flat());
    });
  }, [connection, processAccount]);

  useEffect(() => {
    const subID = connection.onProgramAccountChange(
      LENDING_PROGRAM_ID,
      async info => {
        const id = (info.accountId as unknown) as string;
        const item = {
          pubkey: new PublicKey(id),
          account: info.accountInfo,
        };
        processAccount(item);
      },
      'singleGossip',
    );

    return () => {
      connection.removeProgramAccountChangeListener(subID);
    };
  }, [connection, lendingAccounts, processAccount]);

  return { accounts: lendingAccounts };
};
