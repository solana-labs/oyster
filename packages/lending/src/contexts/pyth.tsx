import { contexts, PYTH_PROGRAM_ID, useConnectionConfig } from '@oyster/common';
import {
  parseMappingData,
  parsePriceData,
  parseProductData,
} from '@pythnetwork/client';
import { PublicKey } from '@solana/web3.js';
import React, { useCallback, useContext, useEffect, useState } from 'react';

const { useConnection } = contexts.Connection;
const { getMultipleAccounts } = contexts.Accounts;

type Products = Record<string, Product>;
type Prices = Record<string, Price>;

type Subscription = { id: number; count: number } | undefined;
type Subscriptions = Record<string, Subscription>;

export interface PythContextState {
  products: Products;
  prices: Prices;
  getPrice: (mint: string) => number;
  subscribeToPrice: (mint: string) => () => void;
}

const PythContext = React.createContext<PythContextState>({
  products: {},
  prices: {},
  getPrice: (mint: string) => 0,
  subscribeToPrice: (mint: string) => () => undefined,
});

export function PythProvider({ children = null as any }) {
  const connection = useConnection();
  const { tokenMap } = useConnectionConfig();
  const [products, setProducts] = useState<Products>({});
  const [prices, setPrices] = useState<Prices>({});
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({});

  useEffect(() => {
    (async () => {
      try {
        const accountInfo = await connection.getAccountInfo(PYTH_PROGRAM_ID);
        if (!accountInfo || !accountInfo.data) return;

        const { productAccountKeys } = parseMappingData(accountInfo.data);

        const productInfos = await getMultipleAccounts(
          connection,
          productAccountKeys.map(p => p.toBase58()),
          'confirmed',
        );

        const products = productInfos.array.reduce((products, p) => {
          const product = parseProductData(p.data);
          const symbol = product.product['symbol'];
          products[symbol] = product;
          return products;
        }, {} as Products);
        setProducts(products);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [connection, setProducts]);

  const getPrice = useCallback(
    (mint: string) => {
      const symbol = tokenMap.get(mint)?.symbol;
      if (!symbol) return 0;

      const price = prices[symbol];
      if (!price) return 0;

      return price.price * Math.pow(10, price.exponent);
    },
    [tokenMap, prices],
  );

  const subscribeToPrice = useCallback(
    (mint: string) => {
      const tokenSymbol = tokenMap.get(mint)?.symbol;
      if (tokenSymbol) {
        const symbol = `${tokenSymbol}/USD`;
        const product = products[symbol];
        if (product) {
          let subscription: Subscription;
          (async () => {
            try {
              const accountInfo = await connection.getAccountInfo(
                product.priceAccountKey,
              );
              if (!accountInfo || !accountInfo.data) return;

              const price = parsePriceData(accountInfo.data);
              setPrices({ ...prices, [symbol]: price });

              subscription = subscriptions[symbol];
              if (subscription) {
                subscription.count++;
              } else {
                subscription = {
                  id: connection.onAccountChange(
                    product.priceAccountKey,
                    accountInfo => {
                      const price = parsePriceData(accountInfo.data);
                      setPrices({ ...prices, [symbol]: price });
                    },
                  ),
                  count: 1,
                };
              }
              setSubscriptions({ ...subscriptions, [symbol]: subscription });
            } catch (e) {
              console.error(e);
            }
          })();
          return () => {
            if (subscription) {
              subscription.count--;
              if (!subscription.count) {
                connection.removeAccountChangeListener(subscription.id);
                subscription = undefined;
              }
              setSubscriptions({ ...subscriptions, [symbol]: subscription });
            }
          };
        }
      }
      return () => undefined;
    },
    [tokenMap, products, connection, prices, setPrices, subscriptions, setSubscriptions],
  );

  return (
    <PythContext.Provider
      value={{
        products,
        prices,
        getPrice,
        subscribeToPrice,
      }}
    >
      {children}
    </PythContext.Provider>
  );
}

export const usePyth = () => {
  return useContext(PythContext);
};

export const usePrice = (mint: string) => {
  const { getPrice, subscribeToPrice } = useContext(PythContext);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    setPrice(getPrice(mint));
    return subscribeToPrice(mint);
  }, [setPrice, getPrice, mint, subscribeToPrice]);

  return price;
};

interface Product {
  magic: number;
  version: number;
  type: number;
  size: number;
  priceAccountKey: PublicKey;
  product: ProductAttributes;
}

interface ProductAttributes {
  [index: string]: string;
}

interface Price {
  priceComponents: {
    publisher: PublicKey;
    aggregate: {
      priceComponent: bigint;
      price: number;
      confidenceComponent: bigint;
      confidence: number;
      status: number;
      corporateAction: number;
      publishSlot: bigint;
    };
    latest: {
      priceComponent: bigint;
      price: number;
      confidenceComponent: bigint;
      confidence: number;
      status: number;
      corporateAction: number;
      publishSlot: bigint;
    };
  }[];
  priceComponent: bigint;
  price: number;
  confidenceComponent: bigint;
  confidence: number;
  status: number;
  corporateAction: number;
  publishSlot: bigint;
  magic: number;
  version: number;
  type: number;
  size: number;
  priceType: number;
  exponent: number;
  numComponentPrices: number;
  currentSlot: bigint;
  validSlot: bigint;
  twapComponent: bigint;
  twap: number;
  avolComponent: bigint;
  avol: number;
  drv0Component: bigint;
  drv0: number;
  drv1Component: bigint;
  drv1: number;
  drv2Component: bigint;
  drv2: number;
  drv3Component: bigint;
  drv3: number;
  drv4Component: bigint;
  drv4: number;
  drv5Component: bigint;
  drv5: number;
  productAccountKey: PublicKey;
  nextPriceAccountKey: PublicKey | null;
  aggregatePriceUpdaterAccountKey: PublicKey;
}
