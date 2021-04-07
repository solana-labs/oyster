import { EventEmitter, programIds, useConnection, decodeMetadata, Metadata, getMultipleAccounts, cache, MintParser, ParsedAccount } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { Connection, PublicKey, PublicKeyAndAccount } from '@solana/web3.js';
import BN from 'bn.js';
import React, { useContext, useEffect, useState } from 'react';

export interface MetaContextState {
  metadata: ParsedAccount<Metadata>[];
}

const MetaContext = React.createContext<MetaContextState>(
  {
    metadata: []
  },
);

export function MetaProvider({ children = null as any }) {
  const connection = useConnection();
  const [metadata, setMetadata] = useState<ParsedAccount<Metadata>[]>([]);

  useEffect(() => {
    let dispose = () => {};
    (async () => {

      const mintToMetadata = new Map<string, ParsedAccount<Metadata>>();

      const processMetaData = (meta: PublicKeyAndAccount<Buffer>) => {
        try{
          const metadata = decodeMetadata(meta.account.data);
          if(isValidHttpUrl(metadata.uri) && metadata.uri.indexOf('arweave') >= 0) {
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
      };

      const accounts = await connection.getProgramAccounts(programIds().metadata);
      accounts.forEach(meta => {
        processMetaData(meta);
      });

      await queryExtendedMetadata(connection, setMetadata, mintToMetadata);

      let subId = connection.onProgramAccountChange(programIds().metadata, (info) => {
          const id = (info.accountId as unknown) as string;
          processMetaData({
            pubkey: new PublicKey(id),
            account: info.accountInfo,
          });

          queryExtendedMetadata(connection, setMetadata, mintToMetadata);
      });
      dispose = () => {
        connection.removeProgramAccountChangeListener(subId);
      };
    })();

    return () => {
      dispose();
    }
  }, [connection, setMetadata])

  return (
    <MetaContext.Provider value={{ metadata }}>
      {children}
    </MetaContext.Provider>
  );
}

const queryExtendedMetadata = async (
  connection: Connection,
  setMetadata: (metadata: ParsedAccount<Metadata>[]) => void,
  mintToMeta: Map<string, ParsedAccount<Metadata>>) => {

  const mintToMetadata = new Map<string, ParsedAccount<Metadata>>(mintToMeta);
  const extendedMetadataFetch = new Map<string, Promise<any>>();

  const mints = await getMultipleAccounts(connection, [...mintToMetadata.keys()].filter(k => !cache.get(k)), 'single');
  mints.keys.forEach((key, index) => {
    const mintAccount = mints.array[index];
    const mint = cache.add(key, mintAccount, MintParser) as ParsedAccount<MintInfo>;
    if(mint.info.supply.gt(new BN(1)) || mint.info.decimals !== 0) {
      // naive not NFT check
      mintToMetadata.delete(key);
    } else {
      const metadata = mintToMetadata.get(key);
      if(metadata && metadata.info.uri) {
        extendedMetadataFetch.set(key, fetch(metadata.info.uri).then(async _ => {
          try {
            metadata.info.extended = await _.json();
            if (!metadata.info.extended || metadata.info.extended?.files?.length === 0) {
              mintToMetadata.delete(key);
            } else {
              if(metadata.info.extended?.image) {
                metadata.info.extended.image = `${metadata.info.uri}/${metadata.info.extended.image}`;
              }
            }
          } catch {
            mintToMetadata.delete(key);
            return undefined;
          }
        }).catch(() => {
          mintToMetadata.delete(key);
          return undefined;
        }));
      }
    }
  });

  await Promise.all([...extendedMetadataFetch.values()]);

  setMetadata([...mintToMetadata.values()]);
};

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
