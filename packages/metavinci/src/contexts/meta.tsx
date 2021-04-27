import {
  EventEmitter,
  programIds,
  useConnection,
  decodeMetadata,
  decodeNameSymbolTuple,
  decodeAuction,
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
  AuctionData,
  SafetyDepositBox,
  VaultKey,
  decodeSafetyDeposit,
  BidderMetadata,
  decodeBidderMetadata,
  BidderPot,
  decodeBidderPot,
  BIDDER_METADATA_LEN,
  BIDDER_POT_LEN,
  decodeVault,
  Vault,
} from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { Connection, PublicKey, PublicKeyAndAccount } from '@solana/web3.js';
import BN from 'bn.js';
import React, { useContext, useEffect, useState } from 'react';
import {
  AuctionManager,
  AuctionManagerStatus,
  decodeAuctionManager,
  getAuctionManagerKey,
  MetaplexKey,
} from '../models/metaplex';

const { MetadataKey } = actions;
export interface MetaContextState {
  metadata: ParsedAccount<Metadata>[];
  metadataByMint: Record<string, ParsedAccount<Metadata>>;
  nameSymbolTuples: Record<string, ParsedAccount<NameSymbolTuple>>;
  editions: Record<string, ParsedAccount<Edition>>;
  masterEditions: Record<string, ParsedAccount<MasterEdition>>;
  auctionManagers: Record<string, ParsedAccount<AuctionManager>>;
  auctions: Record<string, ParsedAccount<AuctionData>>;
  vaults: Record<string, ParsedAccount<Vault>>;
  bidderMetadataByAuctionAndBidder: Record<
    string,
    ParsedAccount<BidderMetadata>
  >;
  safetyDepositBoxesByVaultAndIndex: Record<
    string,
    ParsedAccount<SafetyDepositBox>
  >;
  bidderPotsByAuctionAndBidder: Record<string, ParsedAccount<BidderPot>>;
}

const MetaContext = React.createContext<MetaContextState>({
  metadata: [],
  metadataByMint: {},
  nameSymbolTuples: {},
  masterEditions: {},
  editions: {},
  auctionManagers: {},
  auctions: {},
  vaults: {},
  bidderMetadataByAuctionAndBidder: {},
  safetyDepositBoxesByVaultAndIndex: {},
  bidderPotsByAuctionAndBidder: {},
});

export function MetaProvider({ children = null as any }) {
  const connection = useConnection();
  const [metadata, setMetadata] = useState<ParsedAccount<Metadata>[]>([]);
  const [metadataByMint, setMetadataByMint] = useState<
    Record<string, ParsedAccount<Metadata>>
  >({});
  const [nameSymbolTuples, setNameSymbolTuples] = useState<
    Record<string, ParsedAccount<NameSymbolTuple>>
  >({});
  const [masterEditions, setMasterEditions] = useState<
    Record<string, ParsedAccount<MasterEdition>>
  >({});
  const [editions, setEditions] = useState<
    Record<string, ParsedAccount<Edition>>
  >({});
  const [auctionManagers, setAuctionManagers] = useState<
    Record<string, ParsedAccount<AuctionManager>>
  >({});
  const [auctions, setAuctions] = useState<
    Record<string, ParsedAccount<AuctionData>>
  >({});
  const [vaults, setVaults] = useState<Record<string, ParsedAccount<Vault>>>(
    {},
  );
  const [
    bidderMetadataByAuctionAndBidder,
    setBidderMetadataByAuctionAndBidder,
  ] = useState<Record<string, ParsedAccount<BidderMetadata>>>({});
  const [
    bidderPotsByAuctionAndBidder,
    setBidderPotsByAuctionAndBidder,
  ] = useState<Record<string, ParsedAccount<BidderPot>>>({});
  const [
    safetyDepositBoxesByVaultAndIndex,
    setSafetyDepositBoxesByVaultAndIndex,
  ] = useState<Record<string, ParsedAccount<SafetyDepositBox>>>({});

  useEffect(() => {
    let dispose = () => {};
    (async () => {
      const processAuctions = async (a: PublicKeyAndAccount<Buffer>) => {
        try {
          const auction = await decodeAuction(a.account.data);
          auction.auctionManagerKey = await getAuctionManagerKey(
            auction.resource,
            a.pubkey,
          );
          const account: ParsedAccount<AuctionData> = {
            pubkey: a.pubkey,
            account: a.account,
            info: auction,
          };
          setAuctions(e => ({
            ...e,
            [a.pubkey.toBase58()]: account,
          }));
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }

        try {
          if (a.account.data.length == BIDDER_METADATA_LEN) {
            const bidderMetadata = await decodeBidderMetadata(a.account.data);

            const account: ParsedAccount<BidderMetadata> = {
              pubkey: a.pubkey,
              account: a.account,
              info: bidderMetadata,
            };
            setBidderMetadataByAuctionAndBidder(e => ({
              ...e,
              [bidderMetadata.auctionPubkey.toBase58() +
              '-' +
              bidderMetadata.bidderPubkey.toBase58()]: account,
            }));
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
        try {
          if (a.account.data.length == BIDDER_POT_LEN) {
            const bidderPot = await decodeBidderPot(a.account.data);
            const account: ParsedAccount<BidderPot> = {
              pubkey: a.pubkey,
              account: a.account,
              info: bidderPot,
            };
            setBidderPotsByAuctionAndBidder(e => ({
              ...e,
              [bidderPot.auctionAct.toBase58() +
              '-' +
              bidderPot.bidderAct.toBase58()]: account,
            }));
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
      };

      const accounts = await connection.getProgramAccounts(
        programIds().auction,
      );
      for (let i = 0; i < accounts.length; i++) {
        await processAuctions(accounts[i]);
      }

      let subId = connection.onProgramAccountChange(
        programIds().auction,
        async info => {
          const pubkey =
            typeof info.accountId === 'string'
              ? new PublicKey((info.accountId as unknown) as string)
              : info.accountId;
          await processAuctions({
            pubkey,
            account: info.accountInfo,
          });
        },
      );
      dispose = () => {
        connection.removeProgramAccountChangeListener(subId);
      };
    })();

    return () => {
      dispose();
    };
  }, [connection, setAuctions]);

  useEffect(() => {
    let dispose = () => {};
    (async () => {
      const processVaultData = async (a: PublicKeyAndAccount<Buffer>) => {
        try {
          if (a.account.data[0] == VaultKey.SafetyDepositBoxV1) {
            const safetyDeposit = await decodeSafetyDeposit(a.account.data);
            const account: ParsedAccount<SafetyDepositBox> = {
              pubkey: a.pubkey,
              account: a.account,
              info: safetyDeposit,
            };
            setSafetyDepositBoxesByVaultAndIndex(e => ({
              ...e,
              [safetyDeposit.vault.toBase58() +
              '-' +
              safetyDeposit.order]: account,
            }));
          } else if (a.account.data[0] == VaultKey.VaultV1) {
            const vault = await decodeVault(a.account.data);
            const account: ParsedAccount<Vault> = {
              pubkey: a.pubkey,
              account: a.account,
              info: vault,
            };
            setVaults(e => ({
              ...e,
              [a.pubkey.toBase58()]: account,
            }));
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
      };

      const accounts = await connection.getProgramAccounts(programIds().vault);
      for (let i = 0; i < accounts.length; i++) {
        await processVaultData(accounts[i]);
      }

      let subId = connection.onProgramAccountChange(
        programIds().vault,
        async info => {
          const pubkey =
            typeof info.accountId === 'string'
              ? new PublicKey((info.accountId as unknown) as string)
              : info.accountId;
          await processVaultData({
            pubkey,
            account: info.accountInfo,
          });
        },
      );
      dispose = () => {
        connection.removeProgramAccountChangeListener(subId);
      };
    })();

    return () => {
      dispose();
    };
  }, [connection, setSafetyDepositBoxesByVaultAndIndex]);

  useEffect(() => {
    let dispose = () => {};
    (async () => {
      const processAuctionManagers = async (a: PublicKeyAndAccount<Buffer>) => {
        try {
          if (a.account.data[0] == MetaplexKey.AuctionManagerV1) {
            const auctionManager = await decodeAuctionManager(a.account.data);
            const account: ParsedAccount<AuctionManager> = {
              pubkey: a.pubkey,
              account: a.account,
              info: auctionManager,
            };
            setAuctionManagers(e => ({
              ...e,
              [a.pubkey.toBase58()]: account,
            }));
          }
        } catch {
          // ignore errors
          // add type as first byte for easier deserialization
        }
      };

      const accounts = await connection.getProgramAccounts(
        programIds().metaplex,
      );
      for (let i = 0; i < accounts.length; i++) {
        await processAuctionManagers(accounts[i]);
      }

      let subId = connection.onProgramAccountChange(
        programIds().metaplex,
        async info => {
          const pubkey =
            typeof info.accountId === 'string'
              ? new PublicKey((info.accountId as unknown) as string)
              : info.accountId;
          await processAuctionManagers({
            pubkey,
            account: info.accountInfo,
          });
        },
      );
      dispose = () => {
        connection.removeProgramAccountChangeListener(subId);
      };
    })();

    return () => {
      dispose();
    };
  }, [connection, setAuctionManagers]);

  useEffect(() => {
    let dispose = () => {};
    (async () => {
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
              setMetadataByMint(e => ({
                ...e,
                [metadata.mint.toBase58()]: account,
              }));
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

      setMetadataByMint(latest => {
        queryExtendedMetadata(
          connection,
          setMetadata,
          setMetadataByMint,
          latest,
        );
        return latest;
      });

      let subId = connection.onProgramAccountChange(
        programIds().metadata,
        async info => {
          const pubkey =
            typeof info.accountId === 'string'
              ? new PublicKey((info.accountId as unknown) as string)
              : info.accountId;
          await processMetaData({
            pubkey,
            account: info.accountInfo,
          });
          setMetadataByMint(latest => {
            queryExtendedMetadata(
              connection,
              setMetadata,
              setMetadataByMint,
              latest,
            );
            return latest;
          });
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
      value={{
        metadata,
        editions,
        masterEditions,
        nameSymbolTuples,
        auctionManagers,
        auctions,
        metadataByMint,
        safetyDepositBoxesByVaultAndIndex,
        bidderMetadataByAuctionAndBidder,
        bidderPotsByAuctionAndBidder,
        vaults,
      }}
    >
      {children}
    </MetaContext.Provider>
  );
}

const queryExtendedMetadata = async (
  connection: Connection,
  setMetadata: (metadata: ParsedAccount<Metadata>[]) => void,
  setMetadataByMint: (
    metadata: Record<string, ParsedAccount<Metadata>>,
  ) => void,
  mintToMeta: Record<string, ParsedAccount<Metadata>>,
) => {
  const mintToMetadata = { ...mintToMeta };
  const extendedMetadataFetch = new Map<string, Promise<any>>();

  const mints = await getMultipleAccounts(
    connection,
    [...Object.keys(mintToMetadata)].filter(k => !cache.get(k)),
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
      delete mintToMetadata[key];
    } else {
      const metadata = mintToMetadata[key];

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
                  delete mintToMetadata[key];
                } else {
                  if (metadata.info.extended?.image) {
                    metadata.info.extended.image = `${metadata.info.uri}/${metadata.info.extended.image}`;
                  }
                }
              } catch {
                delete mintToMetadata[key];
                return undefined;
              }
            })
            .catch(() => {
              delete mintToMetadata[key];
              return undefined;
            }),
        );
      }
    }
  });

  await Promise.all([...extendedMetadataFetch.values()]);

  setMetadata([...Object.values(mintToMetadata)]);
  setMetadataByMint(mintToMetadata);
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
