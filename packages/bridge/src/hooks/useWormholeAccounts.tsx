import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useConnection,
  useConnectionConfig,
  MintParser,
  cache,
  getMultipleAccounts,
  ParsedAccount,
  TokenAccountParser,
  programIds,
  fromLamports,
} from '@oyster/common';
import { WORMHOLE_PROGRAM_ID } from '../utils/ids';
import { ASSET_CHAIN } from '../utils/assets';
import { useEthereum } from '../contexts';
import { Connection, PublicKey } from '@solana/web3.js';
import { models } from '@oyster/common';
import { AccountInfo, MintInfo } from '@solana/spl-token';
import {
  bridgeAuthorityKey,
  wrappedAssetMintKey,
  WrappedMetaLayout,
} from '@solana/bridge-sdk';

import bs58 from 'bs58';
import {
  COINGECKO_COIN_PRICE_API,
  COINGECKO_POOL_INTERVAL,
  useCoingecko,
} from '../contexts/coingecko';

type WrappedAssetMeta = {
  chain: number;
  decimals: number;
  address: string;
  mintKey: string;
  mint?: ParsedAccount<MintInfo>;
  amount: number;
  amountInUSD: number;
  logo?: string;
  symbol?: string;
  name?: string;
  price?: number;
  explorer?: string;
  wrappedExplorer?: string;
};

const queryWrappedMetaAccounts = async (
  authorityKey: PublicKey,
  connection: Connection,
  setExternalAssets: (arr: WrappedAssetMeta[]) => void,
) => {
  const filters = [
    {
      dataSize: WrappedMetaLayout.span,
    },
    // {
    //   memcmp: {
    //     offset: TransferOutProposalLayout.offsetOf('assetChain'),
    //     bytes: 2,
    //   },
    // },
  ];

  let resp = await (connection as any)._rpcRequest('getProgramAccounts', [
    WORMHOLE_PROGRAM_ID.toBase58(),
    {
      commitment: connection.commitment,
      filters,
    },
  ]);

  const assets = new Map<string, WrappedAssetMeta>();
  const assetsByMint = new Map<string, WrappedAssetMeta>();

  // aggregate all assets that are not from Solana
  resp.result
    .map((acc: any) => ({
      publicKey: new PublicKey(acc.pubkey),
      account: {
        data: bs58.decode(acc.account.data),
        executable: acc.account.executable,
        owner: new PublicKey(acc.account.owner),
        lamports: acc.account.lamports,
      },
    }))
    .map((acc: any) => {
      if (acc.account.data.length === WrappedMetaLayout.span) {
        const metaAccount = WrappedMetaLayout.decode(acc.account.data);
        if (metaAccount.chain !== ASSET_CHAIN.Solana) {
          const assetAddress: string = new Buffer(
            metaAccount.address.slice(12),
          ).toString('hex');

          assets.set(assetAddress, {
            chain: metaAccount.chain,
            address: assetAddress,
            decimals: 9,
            mintKey: '',
            amount: 0,
            amountInUSD: 0,
            // TODO: customize per chain
            explorer: `https://etherscan.io/address/0x${assetAddress}`,
          });
        }
      }
    });

  // build PDAs for mints
  await Promise.all(
    [...assets.keys()].map(async key => {
      const meta = assets.get(key);
      if (!meta) {
        throw new Error('missing key');
      }

      meta.mintKey = (
        await wrappedAssetMintKey(programIds().wormhole.pubkey, authorityKey, {
          chain: meta.chain,
          address: Buffer.from(meta.address, 'hex'),
          decimals: Math.min(meta.decimals, 9),
        })
      ).toBase58();

      assetsByMint.set(meta.mintKey, meta);

      return meta;
    }),
  );

  // query for all mints
  const mints = await getMultipleAccounts(
    connection,
    [...assetsByMint.keys()],
    'singleGossip',
  );

  // cache mints and listen for changes
  mints.keys.forEach((key, index) => {
    if (!mints.array[index]) {
      return;
    }

    const asset = assetsByMint.get(key);
    if (!asset) {
      throw new Error('missing mint');
    }

    try {
      cache.add(key, mints.array[index], MintParser);
    } catch {
      return;
    }
    asset.mint = cache.get(key);
    asset.wrappedExplorer = `https://explorer.solana.com/address/${asset.mintKey}`;

    if (asset.mint) {
      asset.amount =
        parseInt(asset.mint?.info.supply.toString()) /
          Math.pow(10, asset.mint?.info.decimals || 0);
      if (!asset.mint) {
        throw new Error('missing mint');
      }

      // monitor updates for mints
      connection.onAccountChange(asset.mint?.pubkey, acc => {
        cache.add(key, acc);
        asset.mint = cache.get(key);
        if (asset.mint) {
          asset.amount =
            asset.mint?.info.supply.toNumber() /
            Math.pow(10, asset.mint?.info.decimals || 0);
        }

        setExternalAssets([...assets.values()]);
      });
    }

    setExternalAssets([...assets.values()]);
  });
};

const queryCustodyAccounts = async (
  authorityKey: PublicKey,
  connection: Connection,
) => {
  const tokenAccounts = await connection
    .getTokenAccountsByOwner(authorityKey, {
      programId: programIds().token,
    })
    .then(acc =>
      acc.value.map(
        a =>
          cache.add(
            a.pubkey,
            a.account,
            TokenAccountParser,
          ) as ParsedAccount<AccountInfo>,
      ),
    );

  // query for mints
  await getMultipleAccounts(
    connection,
    tokenAccounts.map(a => a.info.mint.toBase58()),
    'single',
  ).then(({ keys, array }) => {
    keys.forEach((key, index) => {
      if (!array[index]) {
        return;
      }

      return cache.add(key, array[index], MintParser);
    });
  });

  return tokenAccounts.map(token => {
    const mint = cache.get(token.info.mint) as ParsedAccount<MintInfo>;
    const asset = mint.pubkey.toBase58();
    return {
      address: asset,
      chain: ASSET_CHAIN.Solana,
      amount: fromLamports(token, mint.info),
      mintKey: asset,
      mint,
      decimals: 9,
      amountInUSD: 0,
      explorer: `https://explorer.solana.com/address/${asset}`,
    } as WrappedAssetMeta;
  });
};

export const useWormholeAccounts = () => {
  const connection = useConnection();
  const { tokenMap: ethTokens } = useEthereum();
  const { tokenMap } = useConnectionConfig();
  const { coinList } = useCoingecko();

  const [] = useState<models.ParsedDataAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [externalAssets, setExternalAssets] = useState<WrappedAssetMeta[]>([]);
  const [amountInUSD, setAmountInUSD] = useState<number>(0);

  useEffect(() => {
    setLoading(true);

    let wormholeSubId = 0;
    (async () => {
      // authority -> query for token accounts to get locked assets
      let authorityKey = await bridgeAuthorityKey(programIds().wormhole.pubkey);

      // get all accounts that moved assets from solana to other chains
      const custodyAccounts = await queryCustodyAccounts(
        authorityKey,
        connection,
      );

      // query wrapped assets that were imported to solana from other chains
      queryWrappedMetaAccounts(authorityKey, connection, assets => {
        setExternalAssets(
          [...custodyAccounts, ...assets].sort(
            (a, b) => a?.symbol?.localeCompare(b.symbol || '') || 0,
          ),
        );
      }).then(() => setLoading(false));

      // TODO: listen to solana accounts for updates

      wormholeSubId = connection.onProgramAccountChange(
        WORMHOLE_PROGRAM_ID,
        info => {
          if (info.accountInfo.data.length === WrappedMetaLayout.span) {
            // TODO: check if new account and update external assets
          }
        },
      );
    })();

    return () => {
      if (wormholeSubId !== 0)
        connection.removeProgramAccountChangeListener(wormholeSubId);
    };
  }, [connection, setExternalAssets]);

  const coingeckoTimer = useRef<number>(0);
  const dataSourcePriceQuery = useCallback(async () => {
    if (externalAssets.length === 0) {
      return;
    }

    const addressToId = new Map<string, string>();
    const idToAsset = new Map<string, WrappedAssetMeta[]>();

    const assetsToQueryNames: WrappedAssetMeta[] = [];

    const ids = externalAssets
      .map(asset => {
        // TODO: add different nets/clusters

        let knownToken = tokenMap.get(asset.mintKey);
        if (knownToken) {
          asset.logo = knownToken.logoURI;
          asset.symbol = knownToken.symbol;
          asset.name = knownToken.name;
        }

        let token = ethTokens.get(`0x${asset.address || ''}`);
        if (token) {
          asset.logo = token.logoURI;
          asset.symbol = token.symbol;
          asset.name = token.name;
        }

        if (asset.symbol) {
          let coinInfo = coinList.get(asset.symbol.toLowerCase());

          if (coinInfo) {
            idToAsset.set(coinInfo.id, [
              ...(idToAsset.get(coinInfo.id) || []),
              asset,
            ]);
            addressToId.set(asset.address, coinInfo.id);
            return coinInfo.id;
          }
        }
      })
      .filter(_ => _);

    assetsToQueryNames.map(() => {
      // TODO: query names using ERC-20?
    });

    if (ids.length === 0) {
      return;
    }
    console.log('Querying Prices...');
    const parameters = `?ids=${ids.join(',')}&vs_currencies=usd`;
    const resp = await window.fetch(COINGECKO_COIN_PRICE_API + parameters);
    const data = await resp.json();
    let totalInUSD = 0;

    Object.keys(data).forEach(key => {
      let assets = idToAsset.get(key);

      if (!assets) {
        return;
      }

      assets.forEach(asset => {
        asset.price = data[key]?.usd || 1;
        asset.amountInUSD =
          Math.round(asset.amount * (asset.price || 1) * 100) / 100;
        totalInUSD += asset.amountInUSD;
      });
    });

    setAmountInUSD(totalInUSD);

    coingeckoTimer.current = window.setTimeout(
      () => dataSourcePriceQuery(),
      COINGECKO_POOL_INTERVAL,
    );
  }, [externalAssets, setAmountInUSD]);

  useEffect(() => {
    if (externalAssets && coinList && !loading) {
      dataSourcePriceQuery();
    }
    return () => {
      window.clearTimeout(coingeckoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAssets, coinList, loading]);

  return {
    loading,
    externalAssets,
    totalInUSD: amountInUSD,
  };
};
