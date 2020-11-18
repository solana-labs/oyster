import React, { useCallback, useContext, useEffect, useState } from "react";
import { useConnection } from "./connection";
import { LENDING_PROGRAM_ID } from "./../constants/ids";
import { LendingReserveLayout, LendingMarketLayout, LendingMarket, LendingMarketParser, isLendingReserve, isLendingMarket, LendingReserveParser } from "./../models/lending";
import { cache, getMultipleAccounts } from "./accounts";
import { AccountInfo, PublicKey } from "@solana/web3.js";

export interface LendingContextState {

}

const LendingContext = React.createContext<LendingContextState | null>(null);

// TODO: 
// query for lending program accounts ?

export function LendingProvider({ children = null as any }) {
  const { accounts } = useLending();
  return (
    <LendingContext.Provider
      value={{
        accounts
      }}
    >
      {children}
    </LendingContext.Provider>
  );
};


export const useLending = () => {
  const connection = useConnection();
  const [lendingAccounts, setLendingAccounts] = useState<any[]>([]);

  // initial query
  useEffect(() => {
    setLendingAccounts([]);

    const queryLendingAccounts = async () => {
      const accounts = (await connection.getProgramAccounts(LENDING_PROGRAM_ID))
        .map((item) => {
          if (isLendingReserve(item.account)) {
            return cache.add(item.pubkey.toBase58(), item.account, LendingReserveParser); 
          } else if (isLendingMarket(item.account)) {
            return cache.add(item.pubkey.toBase58(), item.account, LendingMarketParser); 
          }
        })
        .filter(item => item !== undefined);

      console.log(accounts);

      const toQuery = accounts
        .map(
          (p) =>
            [
              // TODO: add dependent accounts ....
            ].filter((p) => p) as string[]
        )
        .flat();

      // This will pre-cache all accounts used by pools
      // All those accounts are updated whenever there is a change
      await getMultipleAccounts(connection, toQuery, "single").then(
        ({ keys, array }) => {
          return array.map((obj, index) => {
            const pubKey = new PublicKey(keys[index]);
            // TODO: add to cache

            return obj;
          }) as any[];
        }
      );

      return accounts;
    };

    Promise.all([
      queryLendingAccounts(),
    ]).then((all) => {
      setLendingAccounts(all.flat());
    });
  }, [connection]);

  useEffect(() => {
    const subID = connection.onProgramAccountChange(
      LENDING_PROGRAM_ID,
      async (info) => {
        const id = (info.accountId as unknown) as string;
        if (info.accountInfo.data.length === LendingReserveLayout.span) {
          const account = info.accountInfo;
          const updated = {
            data: LendingReserveLayout.decode(account.data),
            account: account,
            pubkey: new PublicKey(id),
          };

          // TODO: update cache and raise events
        }
      },
      "singleGossip"
    );

    return () => {
      connection.removeProgramAccountChangeListener(subID);
    };
  }, [connection, lendingAccounts]);

  return { accounts: lendingAccounts };
};
