import { contexts, useConnectionConfig } from '@oyster/common';
import {
  parseMappingData,
  parsePriceData,
  parseProductData,
} from '@pythnetwork/client';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

const { useConnection } = contexts.Connection;
const { getMultipleAccounts } = contexts.Accounts;

const PYTH_PROGRAM_ID = new PublicKey(
  'BmA9Z6FjioHJPpjT39QazZyhDRUdZy2ezwx4GiDdE2u2',
);

type Products = Record<string, Product>;
type Prices = Record<string, Price>;

// @TODO: subscribe to changes
export const usePythProducts = () => {
  const connection = useConnection();
  const [products, setProducts] = useState<Products>({});

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
  }, [connection]);

  return products;
};

// @TODO: aggregate subscriptions by mint
export const usePythPriceByMint = (mint: string) => {
  const { tokenMap } = useConnectionConfig();
  const products = usePythProducts();
  const connection = useConnection();
  const [price, setPrice] = useState<Price>();

  const symbol = tokenMap.get(mint)?.symbol;

  useEffect(() => {
    const subscriptionIds = [] as number[];
    if (symbol) {
      const product = products[`${symbol}/USD`];
      if (product) {
        (async () => {
          try {
            const accountInfo = await connection.getAccountInfo(
              product.priceAccountKey,
            );
            if (!accountInfo || !accountInfo.data) return;

            const price = parsePriceData(accountInfo.data);
            setPrice(price);

            subscriptionIds.push(
              connection.onAccountChange(product.priceAccountKey, accountInfo => {
                const price = parsePriceData(accountInfo.data);
                setPrice(price);
              }),
            );
          }
          catch (e) {
            console.error(e);
          }
        })();
      }
    }
    return () => {
      for (const subscriptionId of subscriptionIds) {
        connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [products, symbol]);

  return price;
};

export const useMidPriceInUSD = (mint: string) => {
  const price = usePythPriceByMint(mint);
  return price ? price.price * Math.pow(10, price.exponent) : 0;
}

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
