import React, { useCallback, useContext, useEffect, useState } from "react";
import { MINT_TO_MARKET } from "./../models/marketOverrides";
import { POOLS_WITH_AIRDROP } from "./../models/airdrops";
import {
  convert,
  fromLamports,
  getPoolName,
  getTokenName,
  KnownTokenMap,
  STABLE_COINS,
} from "./../utils/utils";
import { useConnectionConfig } from "./connection";
import { cache, getMultipleAccounts, ParsedAccount } from "./accounts";
import { Market, MARKETS, Orderbook, TOKEN_MINTS } from "@project-serum/serum";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { EventEmitter } from "./../utils/eventEmitter";

import { DexMarketParser } from "./../models/dex";
import { LendingMarket, LendingReserve, PoolInfo } from "../models";
import { LIQUIDITY_PROVIDER_FEE, SERUM_FEE } from "../utils/pools";

const INITAL_LIQUIDITY_DATE = new Date("2020-10-27");
export const BONFIDA_POOL_INTERVAL = 30 * 60_000; // 30 min

interface RecentPoolData {
  pool_identifier: string;
  volume24hA: number;
}

export interface MarketsContextState {
  midPriceInUSD: (mint: string) => number;
  marketEmitter: EventEmitter;
  accountsToObserve: Map<string, number>;
  marketByMint: Map<string, SerumMarket>;

  subscribeToMarket: (mint: string) => () => void;

  precacheMarkets: (mints: string[]) => void;
  dailyVolume: Map<string, RecentPoolData>;
}

const REFRESH_INTERVAL = 30_000;

const MarketsContext = React.createContext<MarketsContextState | null>(null);

const marketEmitter = new EventEmitter();

export function MarketProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();
  const accountsToObserve = useMemo(() => new Map<string, number>(), []);
  const [marketMints, setMarketMints] = useState<string[]>([]);
  const [dailyVolume, setDailyVolume] = useState<Map<string, RecentPoolData>>(
    new Map()
  );

  const connection = useMemo(() => new Connection(endpoint, "recent"), [
    endpoint,
  ]);

  const marketByMint = useMemo(() => {
    return [...new Set(marketMints).values()].reduce((acc, key) => {
      const mintAddress = key;

      const SERUM_TOKEN = TOKEN_MINTS.find(
        (a) => a.address.toBase58() === mintAddress
      );

      const marketAddress = MINT_TO_MARKET[mintAddress];
      const marketName = `${SERUM_TOKEN?.name}/USDC`;
      const marketInfo = MARKETS.find(
        (m) => m.name === marketName || m.address.toBase58() === marketAddress
      );

      if (marketInfo) {
        acc.set(mintAddress, {
          marketInfo,
        });
      }

      return acc;
    }, new Map<string, SerumMarket>()) as Map<string, SerumMarket>;
  }, [marketMints]);

  useEffect(() => {
    let timer = 0;

    const updateData = async () => {
      await refreshAccounts(connection, [...accountsToObserve.keys()]);
      marketEmitter.raiseMarketUpdated(new Set([...marketByMint.keys()]));

      timer = window.setTimeout(() => updateData(), REFRESH_INTERVAL);
    };

    const initalQuery = async () => {
      const reverseSerumMarketCache = new Map<string, string>();
      [...marketByMint.keys()].forEach((mint) => {
        const m = marketByMint.get(mint);
        if (m) {
          reverseSerumMarketCache.set(m.marketInfo.address.toBase58(), mint);
        }
      });

      const allMarkets = [...marketByMint.values()].map((m) => {
        return m.marketInfo.address.toBase58();
      });

      await getMultipleAccounts(
        connection,
        // only query for markets that are not in cahce
        allMarkets.filter((a) => cache.get(a) === undefined),
        "single"
      ).then(({ keys, array }) => {
        allMarkets.forEach(() => {});

        return array.map((item, index) => {
          const marketAddress = keys[index];
          const mintAddress = reverseSerumMarketCache.get(marketAddress);
          if (mintAddress) {
            const market = marketByMint.get(mintAddress);

            if (market) {
              const id = market.marketInfo.address;
              cache.add(id, item, DexMarketParser);
            }
          }

          return item;
        });
      });

      const toQuery = new Set<string>();
      allMarkets.forEach((m) => {
        const market = cache.get(m);
        if (!market) {
          return;
        }

        const decoded = market;

        if (!cache.get(decoded.info.baseMint)) {
          toQuery.add(decoded.info.baseMint.toBase58());
        }

        if (!cache.get(decoded.info.baseMint)) {
          toQuery.add(decoded.info.quoteMint.toBase58());
        }

        toQuery.add(decoded.info.bids.toBase58());
        toQuery.add(decoded.info.asks.toBase58());
      });

      await refreshAccounts(connection, [...toQuery.keys()]);

      marketEmitter.raiseMarketUpdated(new Set([...marketByMint.keys()]));

      // start update loop
      updateData();
    };

    initalQuery();

    return () => {
      window.clearTimeout(timer);
    };
  }, [marketByMint, accountsToObserve, connection]);

  const midPriceInUSD = useCallback(
    (mintAddress: string) => {
      return getMidPrice(
        marketByMint.get(mintAddress)?.marketInfo.address.toBase58(),
        mintAddress
      );
    },
    [marketByMint]
  );

  const subscribeToMarket = useCallback(
    (mintAddress: string) => {
      const info = marketByMint.get(mintAddress);
      const market = cache.get(info?.marketInfo.address.toBase58() || "");
      if (!market) {
        return () => {};
      }

      // TODO: get recent volume

      const bid = market.info.bids.toBase58();
      const ask = market.info.asks.toBase58();
      accountsToObserve.set(bid, (accountsToObserve.get(bid) || 0) + 1);
      accountsToObserve.set(ask, (accountsToObserve.get(ask) || 0) + 1);

      // TODO: add event queue to query for last trade

      return () => {
        accountsToObserve.set(bid, (accountsToObserve.get(bid) || 0) - 1);
        accountsToObserve.set(ask, (accountsToObserve.get(ask) || 0) - 1);

        // cleanup
        [...accountsToObserve.keys()].forEach((key) => {
          if ((accountsToObserve.get(key) || 0) <= 0) {
            accountsToObserve.delete(key);
          }
        });
      };
    },
    [marketByMint, accountsToObserve]
  );

  const precacheMarkets = useCallback(
    (mints: string[]) => {
      const newMints = [...new Set([...marketMints, ...mints]).values()];

      if (marketMints.length !== newMints.length) {
        setMarketMints(newMints);
      }
    },
    [setMarketMints, marketMints]
  );

  return (
    <MarketsContext.Provider
      value={{
        midPriceInUSD,
        marketEmitter,
        accountsToObserve,
        marketByMint,
        subscribeToMarket,
        precacheMarkets,
        dailyVolume,
      }}
    >
      {children}
    </MarketsContext.Provider>
  );
}

export const useMarkets = () => {
  const context = useContext(MarketsContext);
  return context as MarketsContextState;
};

export const useEnrichedPools = (pools: PoolInfo[]) => {
  const context = useContext(MarketsContext);
  const { tokenMap } = useConnectionConfig();
  const [enriched, setEnriched] = useState<any[]>([]);
  const subscribeToMarket = context?.subscribeToMarket;
  const marketEmitter = context?.marketEmitter;
  const marketsByMint = context?.marketByMint;
  const dailyVolume = context?.dailyVolume;
  const poolKeys = pools.map((p) => p.pubkeys.account.toBase58()).join(",");

  useEffect(() => {
    if (!marketEmitter || !subscribeToMarket || pools.length === 0) {
      return;
    }
    //@ts-ignore
    const mints = [...new Set([...marketsByMint?.keys()]).keys()];

    const subscriptions = mints.map((m) => subscribeToMarket(m));

    const update = () => {
      setEnriched(
        createEnrichedPools(pools, marketsByMint, dailyVolume, tokenMap)
      );
    };

    const dispose = marketEmitter.onMarket(update);

    update();

    return () => {
      dispose && dispose();
      subscriptions.forEach((dispose) => dispose && dispose());
    };
    // Do not add pools here, causes a really bad infinite rendering loop. Use poolKeys instead.
  }, [
    pools,
    tokenMap,
    dailyVolume,
    poolKeys,
    subscribeToMarket,
    marketEmitter,
    marketsByMint,
  ]);

  return enriched;
};

// TODO:
// 1. useEnrichedPools
//      combines market and pools and user info
// 2. ADD useMidPrice with event to refresh price
// that could subscribe to multiple markets and trigger refresh of those markets only when there is active subscription

function createEnrichedPools(
  pools: PoolInfo[],
  marketByMint: Map<string, SerumMarket> | undefined,
  poolData: Map<string, RecentPoolData> | undefined,
  tokenMap: KnownTokenMap
) {
  const TODAY = new Date();

  if (!marketByMint) {
    return [];
  }
  const result = pools
    .filter((p) => p.pubkeys.holdingMints && p.pubkeys.holdingMints.length > 1)
    .map((p, index) => {
      const mints = (p.pubkeys.holdingMints || [])
        .map((a) => a.toBase58())
        .sort();
      const mintA = cache.getMint(mints[0]);
      const mintB = cache.getMint(mints[1]);

      const account0 = cache.get(p.pubkeys.holdingAccounts[0]);
      const account1 = cache.get(p.pubkeys.holdingAccounts[1]);

      const accountA =
        account0?.info.mint.toBase58() === mints[0] ? account0 : account1;
      const accountB =
        account1?.info.mint.toBase58() === mints[1] ? account1 : account0;

      const baseMid = getMidPrice(
        marketByMint.get(mints[0])?.marketInfo.address.toBase58() || "",
        mints[0]
      );
      const baseReserveUSD = baseMid * convert(accountA, mintA);

      const quote = getMidPrice(
        marketByMint.get(mints[1])?.marketInfo.address.toBase58() || "",
        mints[1]
      );
      const quoteReserveUSD = quote * convert(accountB, mintB);

      const poolMint = cache.getMint(p.pubkeys.mint);
      if (poolMint?.supply.eqn(0)) {
        return undefined;
      }

      let airdropYield = calculateAirdropYield(
        p,
        marketByMint,
        baseReserveUSD,
        quoteReserveUSD
      );

      let volume = 0;
      let volume24h =
        baseMid * (poolData?.get(p.pubkeys.mint.toBase58())?.volume24hA || 0);
      let fees24h = volume24h * (LIQUIDITY_PROVIDER_FEE - SERUM_FEE);
      let fees = 0;
      let apy = airdropYield;
      let apy24h = airdropYield;
      if (p.pubkeys.feeAccount) {
        const feeAccount = cache.get(p.pubkeys.feeAccount);

        if (
          poolMint &&
          feeAccount &&
          feeAccount.info.mint.toBase58() === p.pubkeys.mint.toBase58()
        ) {
          const feeBalance = feeAccount?.info.amount.toNumber();
          const supply = poolMint?.supply.toNumber();

          const ownedPct = feeBalance / supply;

          const poolOwnerFees =
            ownedPct * baseReserveUSD + ownedPct * quoteReserveUSD;
          volume = poolOwnerFees / 0.0004;
          fees = volume * LIQUIDITY_PROVIDER_FEE;

          if (fees !== 0) {
            const baseVolume = (ownedPct * baseReserveUSD) / 0.0004;
            const quoteVolume = (ownedPct * quoteReserveUSD) / 0.0004;

            // Aproximation not true for all pools we need to fine a better way
            const daysSinceInception = Math.floor(
              (TODAY.getTime() - INITAL_LIQUIDITY_DATE.getTime()) /
                (24 * 3600 * 1000)
            );
            const apy0 =
              parseFloat(
                ((baseVolume / daysSinceInception) *
                  LIQUIDITY_PROVIDER_FEE *
                  356) as any
              ) / baseReserveUSD;
            const apy1 =
              parseFloat(
                ((quoteVolume / daysSinceInception) *
                  LIQUIDITY_PROVIDER_FEE *
                  356) as any
              ) / quoteReserveUSD;

            apy = apy + Math.max(apy0, apy1);

            const apy24h0 =
              parseFloat((volume24h * LIQUIDITY_PROVIDER_FEE * 356) as any) /
              baseReserveUSD;
            apy24h = apy24h + apy24h0;
          }
        }
      }

      const lpMint = cache.getMint(p.pubkeys.mint);

      const name = getPoolName(tokenMap, p);
      const link = `#/?pair=${getPoolName(tokenMap, p, false).replace(
        "/",
        "-"
      )}`;

      return {
        key: p.pubkeys.account.toBase58(),
        id: index,
        name,
        names: mints.map((m) => getTokenName(tokenMap, m)),
        accounts: [accountA?.pubkey, accountB?.pubkey],
        address: p.pubkeys.mint.toBase58(),
        link,
        mints,
        liquidityA: convert(accountA, mintA),
        liquidityAinUsd: baseReserveUSD,
        liquidityB: convert(accountB, mintB),
        liquidityBinUsd: quoteReserveUSD,
        supply:
          lpMint &&
          (
            lpMint?.supply.toNumber() / Math.pow(10, lpMint?.decimals || 0)
          ).toFixed(9),
        fees,
        fees24h,
        liquidity: baseReserveUSD + quoteReserveUSD,
        volume,
        volume24h,
        apy: Number.isFinite(apy) ? apy : 0,
        apy24h: Number.isFinite(apy24h) ? apy24h : 0,
        map: poolData,
        extra: poolData?.get(p.pubkeys.account.toBase58()),
        raw: p,
      };
    })
    .filter((p) => p !== undefined);
  return result;
}

function calculateAirdropYield(
  p: PoolInfo,
  marketByMint: Map<string, SerumMarket>,
  baseReserveUSD: number,
  quoteReserveUSD: number
) {
  let airdropYield = 0;
  let poolWithAirdrop = POOLS_WITH_AIRDROP.find((drop) =>
    drop.pool.equals(p.pubkeys.mint)
  );
  if (poolWithAirdrop) {
    airdropYield = poolWithAirdrop.airdrops.reduce((acc, item) => {
      const market = marketByMint.get(item.mint.toBase58())?.marketInfo.address;
      if (market) {
        const midPrice = getMidPrice(market?.toBase58(), item.mint.toBase58());

        acc =
          acc +
          // airdrop yield
          ((item.amount * midPrice) / (baseReserveUSD + quoteReserveUSD)) *
            (365 / 30);
      }

      return acc;
    }, 0);
  }
  return airdropYield;
}

export const useMidPriceInUSD = (mint: string) => {
  const { midPriceInUSD, subscribeToMarket, marketEmitter } = useContext(
    MarketsContext
  ) as MarketsContextState;
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    let subscription = subscribeToMarket(mint);
    const update = () => {
      if (midPriceInUSD) {
        setPrice(midPriceInUSD(mint));
      }
    };

    update();
    const dispose = marketEmitter.onMarket(update);

    return () => {
      subscription();
      dispose();
    };
  }, [midPriceInUSD, mint, marketEmitter, subscribeToMarket]);

  return { price, isBase: price === 1.0 };
};

export const usePrecacheMarket = () => {
  const context = useMarkets();
  return context.precacheMarkets;
};

export const simulateMarketOrderFill = (
  amount: number,
  reserve: LendingReserve,
  dex: PublicKey,
  useBBO = false
) => {
  const liquidityMint = cache.get(reserve.liquidityMint);
  const collateralMint = cache.get(reserve.collateralMint);
  if (!liquidityMint || !collateralMint) {
    return 0.0;
  }

  const marketInfo = cache.get(dex);
  if (!marketInfo) {
    return 0.0;
  }
  const decodedMarket = marketInfo.info;

  const baseMintDecimals =
    cache.get(decodedMarket.baseMint)?.info.decimals || 0;
  const quoteMintDecimals =
    cache.get(decodedMarket.quoteMint)?.info.decimals || 0;

  const lendingMarket = cache.get(reserve.lendingMarket) as ParsedAccount<
    LendingMarket
  >;

  const dexMarket = new Market(
    decodedMarket,
    baseMintDecimals,
    quoteMintDecimals,
    undefined,
    decodedMarket.programId
  );

  const bidInfo = cache.get(decodedMarket?.bids)?.info;
  const askInfo = cache.get(decodedMarket?.asks)?.info;
  if (!bidInfo || !askInfo) {
    return 0;
  }

  const bids = new Orderbook(dexMarket, bidInfo.accountFlags, bidInfo.slab);
  const asks = new Orderbook(dexMarket, askInfo.accountFlags, askInfo.slab);

  const book = lendingMarket.info.quoteMint.equals(reserve.liquidityMint)
    ? bids
    : asks;

  let cost = 0;
  let remaining = fromLamports(amount, liquidityMint.info);

  const op = book.isBids
    ? (price: number, size: number) => size / price
    : (price: number, size: number) => size * price;

  if (useBBO) {
    const price = bbo(bids, asks);

    return op(price, remaining);
  } else {
    const depth = book.getL2(1000);
    let price, sizeAtLevel: number;

    for ([price, sizeAtLevel] of depth) {
      let filled = remaining > sizeAtLevel ? sizeAtLevel : remaining;
      cost = cost + op(price, filled);
      remaining = remaining - filled;

      if (remaining <= 0) {
        break;
      }
    }
  }

  return cost;
};

const bbo = (bidsBook: Orderbook, asksBook: Orderbook) => {
  const bestBid = bidsBook.getL2(1);
  const bestAsk = asksBook.getL2(1);

  if (bestBid.length > 0 && bestAsk.length > 0) {
    return (bestBid[0][0] + bestAsk[0][0]) / 2.0;
  }

  return 0;
};

const getMidPrice = (marketAddress?: string, mintAddress?: string) => {
  const SERUM_TOKEN = TOKEN_MINTS.find(
    (a) => a.address.toBase58() === mintAddress
  );

  if (STABLE_COINS.has(SERUM_TOKEN?.name || "")) {
    return 1.0;
  }

  if (!marketAddress) {
    return 0.0;
  }

  const marketInfo = cache.get(marketAddress);
  if (!marketInfo) {
    return 0.0;
  }

  const decodedMarket = marketInfo.info;

  const baseMintDecimals =
    cache.get(decodedMarket.baseMint)?.info.decimals || 0;
  const quoteMintDecimals =
    cache.get(decodedMarket.quoteMint)?.info.decimals || 0;

  const market = new Market(
    decodedMarket,
    baseMintDecimals,
    quoteMintDecimals,
    undefined,
    decodedMarket.programId
  );

  const bids = cache.get(decodedMarket.bids)?.info;
  const asks = cache.get(decodedMarket.asks)?.info;

  if (bids && asks) {
    const bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
    const asksBook = new Orderbook(market, asks.accountFlags, asks.slab);

    return bbo(bidsBook, asksBook);
  }

  return 0;
};

const refreshAccounts = async (connection: Connection, keys: string[]) => {
  if (keys.length === 0) {
    return [];
  }

  return getMultipleAccounts(connection, keys, "single").then(
    ({ keys, array }) => {
      return array.map((item, index) => {
        const address = keys[index];
        return cache.add(new PublicKey(address), item);
      });
    }
  );
};

interface SerumMarket {
  marketInfo: {
    address: PublicKey;
    name: string;
    programId: PublicKey;
    deprecated: boolean;
  };

  // 1st query
  marketAccount?: AccountInfo<Buffer>;

  // 2nd query
  mintBase?: AccountInfo<Buffer>;
  mintQuote?: AccountInfo<Buffer>;
  bidAccount?: AccountInfo<Buffer>;
  askAccount?: AccountInfo<Buffer>;
  eventQueue?: AccountInfo<Buffer>;

  swap?: {
    dailyVolume: number;
  };

  midPrice?: (mint?: PublicKey) => number;
}
