import {
  EventEmitter,
  programIds,
  useConnection,
  decodeMetadata,
  decodeNameSymbolTuple,
  decodeEdition,
  decodeMasterEdition,
  Metadata,
  getMultipleAccounts,
  cache,
  MintParser,
  ParsedAccount,
  actions,
  Edition,
  MasterEdition,
  NameSymbolTuple,
} from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { Connection, PublicKey, PublicKeyAndAccount } from '@solana/web3.js';
import BN from 'bn.js';
import React, { useContext, useEffect, useState } from 'react';

const { MetadataKey } = actions;
export interface MetaContextState {
  metadata: ParsedAccount<Metadata>[];
  nameSymbolTuples: Record<string, ParsedAccount<NameSymbolTuple>>;
  editions: Record<string, ParsedAccount<Edition>>;
  masterEditions: Record<string, ParsedAccount<MasterEdition>>;
}

const MetaContext = React.createContext<MetaContextState>({
  metadata: [],
  nameSymbolTuples: {},
  masterEditions: {},
  editions: {},
});

export function MetaProvider({ children = null as any }) {
  const connection = useConnection();
  const [metadata, setMetadata] = useState<ParsedAccount<Metadata>[]>([]);
  const [nameSymbolTuples, setNameSymbolTuples] = useState<
    Record<string, ParsedAccount<NameSymbolTuple>>
  >({});
  const [masterEditions, setMasterEditions] = useState<
    Record<string, ParsedAccount<MasterEdition>>
  >({});
  const [editions, setEditions] = useState<
    Record<string, ParsedAccount<Edition>>
  >({});

  useEffect(() => {
    let dispose = () => {};
    (async () => {
      const mintToMetadata = new Map<string, ParsedAccount<Metadata>>();

      const processMetaData = async (meta: PublicKeyAndAccount<Buffer>) => {
        try {
          if (meta.account.data[0] == MetadataKey.MetadataV1) {
            const metadata = await decodeMetadata(meta.account.data);
            if (
              isValidHttpUrl(metadata.uri) &&
              metadata.uri.indexOf('arweave') >= 0
            ) {
              const account: ParsedAccount<Metadata> = {
                pubkey: meta.pubkey,
                account: meta.account,
                info: metadata,
              };
              mintToMetadata.set(metadata.mint.toBase58(), account);
            }
          } else if (meta.account.data[0] == MetadataKey.EditionV1) {
            const edition = decodeEdition(meta.account.data);
            const account: ParsedAccount<Edition> = {
              pubkey: meta.pubkey,
              account: meta.account,
              info: edition,
            };
            setEditions(e => ({ ...e, [meta.pubkey.toBase58()]: account }));
          } else if (meta.account.data[0] == MetadataKey.MasterEditionV1) {
            const masterEdition = decodeMasterEdition(meta.account.data);
            const account: ParsedAccount<MasterEdition> = {
              pubkey: meta.pubkey,
              account: meta.account,
              info: masterEdition,
            };
            setMasterEditions(e => ({
              ...e,
              [meta.pubkey.toBase58()]: account,
            }));
          } else if (meta.account.data[0] == MetadataKey.NameSymbolTupleV1) {
            const nameSymbolTuple = decodeNameSymbolTuple(meta.account.data);
            const account: ParsedAccount<NameSymbolTuple> = {
              pubkey: meta.pubkey,
              account: meta.account,
              info: nameSymbolTuple,
            };
            setNameSymbolTuples(e => ({
              ...e,
              [meta.pubkey.toBase58()]: account,
            }));
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
      };

      const accounts = await connection.getProgramAccounts(
        programIds().metadata,
      );
      for (let i = 0; i < accounts.length; i++) {
        await processMetaData(accounts[i]);
      }

      await queryExtendedMetadata(connection, setMetadata, mintToMetadata);

      let subId = connection.onProgramAccountChange(
        programIds().metadata,
        async info => {
          const pubkey = typeof info.accountId === 'string' ?
            new PublicKey((info.accountId as unknown) as string) :
            info.accountId;
          await processMetaData({
            pubkey,
            account: info.accountInfo,
          });

          queryExtendedMetadata(connection, setMetadata, mintToMetadata);
        },
      );
      dispose = () => {
        connection.removeProgramAccountChangeListener(subId);
      };
    })();

    return () => {
      dispose();
    };
  }, [
    connection,
    setMetadata,
    setMasterEditions,
    setNameSymbolTuples,
    setEditions,
  ]);

  return (
    <MetaContext.Provider
      value={{ metadata, editions, masterEditions, nameSymbolTuples }}
    >
      {children}
    </MetaContext.Provider>
  );
}

const queryExtendedMetadata = async (
  connection: Connection,
  setMetadata: (metadata: ParsedAccount<Metadata>[]) => void,
  mintToMeta: Map<string, ParsedAccount<Metadata>>,
) => {
  const mintToMetadata = new Map<string, ParsedAccount<Metadata>>(mintToMeta);
  const extendedMetadataFetch = new Map<string, Promise<any>>();

  const mints = await getMultipleAccounts(
    connection,
    [...mintToMetadata.keys()].filter(k => !cache.get(k)),
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
      if (metadata && metadata.info.uri) {
        extendedMetadataFetch.set(
          key,
          fetch(metadata.info.uri)
            .then(async _ => {
              try {
                metadata.info.extended = await _.json();
                if (
                  !metadata.info.extended ||
                  metadata.info.extended?.files?.length === 0
                ) {
                  mintToMetadata.delete(key);
                } else {
                  if (metadata.info.extended?.image) {
                    metadata.info.extended.image = `${metadata.info.uri}/${metadata.info.extended.image}`;
                  }
                }
              } catch {
                mintToMetadata.delete(key);
                return undefined;
              }
            })
            .catch(() => {
              mintToMetadata.delete(key);
              return undefined;
            }),
        );
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

  return url.protocol === 'http:' || url.protocol === 'https:';
}
