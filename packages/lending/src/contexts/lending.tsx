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
        return cache.add(
          item.pubkey.toBase58(),
          item.account,
          ReserveParser,
        );
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
        reserveAccounts.map(reserve =>
          reserve.info.liquidity.mintPubkey.toBase58(),
        ),
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
        .filter(acc => acc?.account && isReserve(acc.account) && (acc.info as Reserve).lendingMarket !== undefined)
        .map(acc => acc as ParsedAccount<Reserve>);

      const toQuery = [
        ...lendingReserves.map(acc => {
          const result = [
            cache.registerParser(
              acc?.info.collateral.mintPubkey.toBase58(),
              MintParser,
            ),
            cache.registerParser(
              acc?.info.liquidity.mintPubkey.toBase58(),
              MintParser,
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
        const pubkey = typeof info.accountId === 'string' ?
            new PublicKey((info.accountId as unknown) as string) :
            info.accountId;
        const item = {
          pubkey,
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
