import {EventEmitter} from "@oyster/common";
import React, {useContext, useEffect, useState} from "react";
import {MarketsContextState} from "./market";

export const COINGECKO_POOL_INTERVAL = 2 * 60_000; // 2 min
export const COINGECKO_API = "https://api.coingecko.com/api/v3/"
export const COINGECKO_COIN_LIST_API = `${COINGECKO_API}coins/list`
export const COINGECKO_COIN_PRICE_API = `${COINGECKO_API}simple/price`

interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
}

export interface CoingeckoContextState {
  coinList: Map<string, CoinInfo>;
}

const CoingeckoContext = React.createContext<CoingeckoContextState | null>(null);
export function CoingeckoProvider({ children = null as any }) {
  const [coinList, setCoinList] = useState<Map<string, CoinInfo>>(new Map())

  useEffect(() => {
      (async () => {
        const listResponse = await fetch(COINGECKO_COIN_LIST_API);
        const coinList: CoinInfo[] = await listResponse.json();
        setCoinList(
          coinList.reduce((coins, val) => {
            coins.set(val.symbol, val);
            return coins;
          }, new Map<string, CoinInfo>())
        )
      })();
    }, [setCoinList]);

  return (
    <CoingeckoContext.Provider value={{coinList: coinList}}>
      {children}
    </CoingeckoContext.Provider>
  )
}

export const useCoingecko = () => {
  const context = useContext(CoingeckoContext);
  return context as CoingeckoContextState;
};
