import {
  EventEmitter,
  programIds,
  useConnection,
  decodeMetadata,
  Metadata,
  getMultipleAccounts,
  cache,
  MintParser,
  ParsedAccount,
} from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import BN from 'bn.js';
import React, { useContext, useEffect, useState } from 'react';
import { MarketsContextState } from './market';

export interface VinciAccountsContextState {
  metaAccounts: Metadata[];
}

const VinciAccountsContext = React.createContext<VinciAccountsContextState | null>(
  null,
);

export function VinciAccountsProvider({ children = null as any }) {
  const connection = useConnection();
  const [metaAccounts, setMetaAccounts] = useState<Metadata[]>([]);

  useEffect(() => {
    (async () => {
      const metadataAccounts = await connection.getProgramAccounts(
        programIds().metadata,
      );

      const mintToMetadata = new Map<string, Metadata>();
      const extendedMetadataFetch = new Map<string, Promise<any>>();

      metadataAccounts.forEach(meta => {
        try {
          const metadata = decodeMetadata(meta.account.data);
          if (isValidHttpUrl(metadata.uri)) {
            mintToMetadata.set(metadata.mint.toBase58(), metadata);
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
      });

      const mints = await getMultipleAccounts(
        connection,
        [...mintToMetadata.keys()],
        'single',
      );
      mints.keys.forEach((key, index) => {
        const mintAccount = mints.array[index];
        const mint = cache.add(
          key,
          mintAccount,
          MintParser,
        ) as ParsedAccount<MintInfo>;
        if (mint.info.supply.gt(new BN(1)) || mint.info.decimals !== 0) {
          // naive not NFT check
          mintToMetadata.delete(key);
        } else {
          const metadata = mintToMetadata.get(key);
          if (metadata && metadata.uri) {
            extendedMetadataFetch.set(
              key,
              fetch(metadata.uri)
                .catch(() => {
                  mintToMetadata.delete(key);
                  return undefined;
                })
                .then(_ => {
                  metadata.extended = _;
                }),
            );
          }
        }
      });

      Promise.all([...extendedMetadataFetch.values()]);

      setMetaAccounts([...mintToMetadata.values()]);

      console.log([...mintToMetadata.values()]);
    })();
  }, [connection, setMetaAccounts]);

  return (
    <VinciAccountsContext.Provider value={{ metaAccounts }}>
      {children}
    </VinciAccountsContext.Provider>
  );
}

export const useCoingecko = () => {
  const context = useContext(VinciAccountsContext);
  return context as VinciAccountsContextState;
};

function isValidHttpUrl(text: string) {
  let url;

  try {
    url = new URL(text);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}
