import { EventEmitter, programIds, useConnection, decodeMetadata, Metadata, getMultipleAccounts, cache, MintParser, ParsedAccount } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import BN from 'bn.js';
import React, { useContext, useEffect, useState } from 'react';

export interface MetaContextState {
  accounts: ParsedAccount<Metadata>[];
}

const MetaContext = React.createContext<MetaContextState>(
  {
    accounts: []
  },
);

export function MetaProvider({ children = null as any }) {
  const connection = useConnection();
  const [accounts, setMetaAccounts] = useState<ParsedAccount<Metadata>[]>([]);

  useEffect(() => {
    (async () => {
      const accounts = await connection.getProgramAccounts(programIds().metadata);

      const mintToMetadata = new Map<string, ParsedAccount<Metadata>>();
      const extendedMetadataFetch = new Map<string, Promise<any>>();

      accounts.forEach(meta => {
        try{
          const metadata = decodeMetadata(meta.account.data);
          if(isValidHttpUrl(metadata.uri)) {
            const account: ParsedAccount<Metadata> = {
              pubkey: meta.pubkey,
              account: meta.account,
              info: metadata,
            };
            mintToMetadata.set(metadata.mint.toBase58(), account);
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
      });

      const mints = await getMultipleAccounts(connection, [...mintToMetadata.keys()], 'single');
      mints.keys.forEach((key, index) => {
        const mintAccount = mints.array[index];
        const mint = cache.add(key, mintAccount, MintParser) as ParsedAccount<MintInfo>;
        if(mint.info.supply.gt(new BN(1)) || mint.info.decimals !== 0) {
          // naive not NFT check
          mintToMetadata.delete(key);
        } else {
          const metadata = mintToMetadata.get(key);
          if(metadata && metadata.info.uri) {
            extendedMetadataFetch.set(key, fetch(metadata.info.uri).catch(() => {
              mintToMetadata.delete(key);
              return undefined;
            }).then(_ => {
              metadata.info.extended = _;
            }));
          }
        }
      });

      Promise.all([...extendedMetadataFetch.values()]);

      setMetaAccounts([...mintToMetadata.values()]);

      console.log([...mintToMetadata.values()]);
    })();
  }, [connection, setMetaAccounts])

  return (
    <MetaContext.Provider value={{ accounts }}>
      {children}
    </MetaContext.Provider>
  );
}

export const useMeta = () => {
  const context = useContext(MetaContext);
  return context as MetaContextState;
};

function isValidHttpUrl(text: string) {
  let url;

  try {
    url = new URL(text);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
