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
type Prices = Record<string, number>;

type Subscription = { id: number; count: number } | undefined;
type Subscriptions = Record<string, Subscription>;

export interface PythContextState {
  products: Products;
  prices: Prices;
  getPrice: (mint: string) => number;
}

const PythContext = React.createContext<PythContextState>({
  products: {},
  prices: {},
  getPrice: (mint: string) => 0,
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

  const subscribeToPrice = useCallback(
    (mint: string) => {
      let subscription = subscriptions[mint];
      if (subscription) return;

      let symbol = tokenMap.get(mint)?.symbol;
      if (!symbol) return;

      const product = products[`${ symbol }/USD`];
      if (!product) return;

      const id = connection.onAccountChange(product.priceAccountKey, function (accountInfo) {
        try {
          const price = parsePriceData(accountInfo.data);
          setPrices({ ...prices, [mint]: price.price });
        }
        catch (e) {
          console.error(e);
        }
      });

      // @TODO: add subscription counting / removal
      subscription = { id, count: 1 };
      setSubscriptions({ ...subscriptions, [mint]: subscription });
    },
    [subscriptions, tokenMap, products, connection, prices, setPrices, setSubscriptions],
  );

  const getPrice = useCallback(
    (mint: string) => {
      subscribeToPrice(mint);
      return prices[mint] || 0;
    },
    [subscribeToPrice, prices],
  );

  return (
    <PythContext.Provider
      value={{
        products,
        prices,
        getPrice,
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
  const { getPrice } = useContext(PythContext);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    setPrice(getPrice(mint));
  }, [setPrice, getPrice, mint]);

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
