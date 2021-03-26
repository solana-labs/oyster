import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useConnection,
  useConnectionConfig,
  // MintParser,
  // cache,
  // getMultipleAccounts,
  // ParsedAccount,
  // TokenAccountParser,
  programIds,
  // fromLamports,
} from '@oyster/common';
import { WORMHOLE_PROGRAM_ID } from '../utils/ids';
import { ASSET_CHAIN } from '../utils/assets';
import { useEthereum } from '../contexts';
import { Connection, PublicKey } from '@solana/web3.js';
// import { models } from '@oyster/common';
// import { /*AccountInfo,*/ MintInfo } from '@solana/spl-token';
import {
  bridgeAuthorityKey,
  TransferOutProposalLayout,
  // wrappedAssetMintKey,
} from './../models/bridge';

import bs58 from 'bs58';
import {
  COINGECKO_COIN_PRICE_API,
  COINGECKO_POOL_INTERVAL,
  useCoingecko,
} from '../contexts/coingecko';
import { BN } from 'bn.js';


type WrappedTransferMeta = {
  chain: number;
  decimals: number;
  address: string;
  // mintKey: string;
  // mint?: ParsedAccount<MintInfo>;
  // amount: number;
  // amountInUSD: number;
  // logo?: string;
  // symbol?: string;
  coinId?: string;
  price?: number;
  explorer?: string;
  // wrappedExplorer?: string;

  logo?: string;
  symbol?: string;
  amount: number;
  value?: number | string;
  txhash?: string;
  date: number; //timestamp?
  status?: string;
};

const queryWrappedMetaTransactions = async (
  authorityKey: PublicKey,
  connection: Connection,
  setTransfers: (arr: WrappedTransferMeta[]) => void,
) => {
  const filters = [
    {
      dataSize: TransferOutProposalLayout.span,
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

  const transfers = new Map<string, WrappedTransferMeta>();
  // const transfersByMint = new Map<string, WrappedTransferMeta>();

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

      if (acc.account.data.length === TransferOutProposalLayout.span) {
        const metaTransfer = TransferOutProposalLayout.decode(acc.account.data);

        // console.log("JOSE", { metaTransfer })
        // if (metaTransfer.chain !== ASSET_CHAIN.Solana) {
        let assetAddress: string = "";
        if (metaTransfer.assetChain !== ASSET_CHAIN.Solana) {
          assetAddress = Buffer.from(
            metaTransfer.assetAddress.slice(12)
          ).toString('hex');
        } else {
          assetAddress = new PublicKey(metaTransfer.assetAddress).toBase58()
        }

        const dec = new BN(10).pow(new BN(metaTransfer.assetDecimals));
        const rawAmount = new BN(metaTransfer.amount, 2, "le")
        const amount = rawAmount.div(dec).toNumber()
        const txhash = acc.publicKey.toBase58()

        transfers.set(assetAddress, {
          amount,
          date: metaTransfer.vaaTime,

          chain: metaTransfer.assetChain,
          address: assetAddress,
          decimals: 9,
          txhash,
          // amount: 0,
          // amountInUSD: 0,
          // TODO: customize per chain
          explorer: `https://explorer.solana.com/address/${txhash}`,
        });
        // }
      }
    });
  // console.log("JOSE", {transfers})

  // build PDAs for mints
  // await Promise.all(
  //   [...transfers.keys()].map(async key => {
  //     const meta = transfers.get(key);
  //     if (!meta) {
  //       throw new Error('missing key');
  //     }

  //     meta.mintKey = (
  //       await wrappedAssetMintKey(programIds().wormhole.pubkey, authorityKey, {
  //         chain: meta.chain,
  //         address: Buffer.from(meta.address, 'hex'),
  //         decimals: Math.min(meta.decimals, 9),
  //       })
  //     ).toBase58();

  //     transfersByMint.set(meta.mintKey, meta);

  //     return meta;
  //   }),
  // );

  // console.log("JOSE", {transfersByMint})

  // // query for all mints
  // const mints = await getMultipleAccounts(
  //   connection,
  //   [...assetsByMint.keys()],
  //   'singleGossip',
  // );

  // cache mints and listen for changes
  // mints.keys.forEach((key, index) => {
  //   if (!mints.array[index]) {
  //     return;
  //   }

  //   const asset = assetsByMint.get(key);
  //   if (!asset) {
  //     throw new Error('missing mint');
  //   }

  //   try {
  //     cache.add(key, mints.array[index], MintParser);
  //   } catch {
  //     return;
  //   }
  //   asset.mint = cache.get(key);
  //   asset.wrappedExplorer = `https://explorer.solana.com/address/${asset.mintKey}`;

  //   if (asset.mint) {
  //     asset.amount =
  //       asset.mint?.info.supply.toNumber() /
  //         Math.pow(10, asset.mint?.info.decimals) || 0;

  //     if (!asset.mint) {
  //       throw new Error('missing mint');
  //     }

  //     // monitor updates for mints
  //     connection.onAccountChange(asset.mint?.pubkey, acc => {
  //       cache.add(key, acc);
  //       asset.mint = cache.get(key);
  //       asset.amount = asset.mint?.info.supply.toNumber() || 0;

  //       setExternalAssets([...assets.values()]);
  //     });
  //   }


  // console.log("setExternalAssets", {assets})
  //   setExternalAssets([...assets.values()]);
  // });
  setTransfers([...transfers.values()])
};

// const queryCustodyAccounts = async (
//   authorityKey: PublicKey,
//   connection: Connection,
// ) => {
//   const tokenAccounts = await connection
//     .getTokenAccountsByOwner(authorityKey, {
//       programId: programIds().token,
//     })
//     .then(acc =>
//       acc.value.map(
//         a =>
//           cache.add(
//             a.pubkey,
//             a.account,
//             TokenAccountParser,
//           ) as ParsedAccount<AccountInfo>,
//       ),
//     );

//   // query for mints
//   await getMultipleAccounts(
//     connection,
//     tokenAccounts.map(a => a.info.mint.toBase58()),
//     'single',
//   ).then(({ keys, array }) => {
//     keys.forEach((key, index) => {
//       if (!array[index]) {
//         return;
//       }

//       return cache.add(key, array[index], MintParser);
//     });
//   });

//   return tokenAccounts.map(token => {
//     const mint = cache.get(token.info.mint) as ParsedAccount<MintInfo>;
//     const asset = mint.pubkey.toBase58();
//     return {
//       address: asset,
//       chain: ASSET_CHAIN.Solana,
//       amount: fromLamports(token, mint.info),
//       mintKey: asset,
//       mint,
//       decimals: 9,
//       amountInUSD: 0,
//       explorer: `https://explorer.solana.com/address/${asset}`,
//     } as WrappedAssetMeta;
//   });
// };

export const useWormholeTransactions = () => {
  const connection = useConnection();
  const { tokenMap: ethTokens } = useEthereum();
  const { tokenMap } = useConnectionConfig();
  const { coinList } = useCoingecko();

  // const [] = useState<models.ParsedDataAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // const [externalAssets, setExternalAssets] = useState<WrappedAssetMeta[]>([]);
  const [transfers, setTransfers] = useState<WrappedTransferMeta[]>([]);
  const [amountInUSD, setAmountInUSD] = useState<number>(0);

  useEffect(() => {
    setLoading(true);

    let wormholeSubId = 0;
    (async () => {
      // authority -> query for token accounts to get locked assets
      let authorityKey = await bridgeAuthorityKey(programIds().wormhole.pubkey);

      // get all accounts that moved assets from solana to other chains
      // const custodyAccounts = await queryCustodyAccounts(
      //   authorityKey,
      //   connection,
      // );

      // query wrapped assets that were imported to solana from other chains
      queryWrappedMetaTransactions(authorityKey, connection, setTransfers).then(() => setLoading(false));

      // TODO: listen to solana accounts for updates

      wormholeSubId = connection.onProgramAccountChange(
        WORMHOLE_PROGRAM_ID,
        info => {
          if (info.accountInfo.data.length === TransferOutProposalLayout.span) {
            // TODO: check if new account and update external assets
          }
        },
      );
    })();

    return () => {
      connection.removeProgramAccountChangeListener(wormholeSubId);
    };
  }, [connection, setTransfers]);

  const coingeckoTimer = useRef<number>(0);
  const dataSourcePriceQuery = useCallback(async () => {
    if (transfers.length === 0) return

    // const transfersByCoinId = new Map<string, WrappedTransferMeta[]>();

    const ids = [...new Set(transfers.map(transfer => {
      let knownToken = tokenMap.get(transfer.address);
      if (knownToken) {
        // console.log("knownToken", { transfer, knownToken })
        transfer.logo = knownToken.logoURI;
        transfer.symbol = knownToken.symbol;
        // transfer.name = knownToken.name;
      }

      let token = ethTokens.get(`0x${transfer.address || ''}`);
      if (token) {
        // console.log("ethToken", { transfer, token })
        transfer.logo = token.logoURI;
        transfer.symbol = token.symbol;
        // transfer.name = token.name;
      }

      if (transfer.symbol) {
        let coinInfo = coinList.get(transfer.symbol.toLowerCase());

        if (coinInfo) {
          transfer.coinId = coinInfo.id
          // transfersByCoinId.set(coinInfo.id, [
          //   ...(transfersByCoinId.get(coinInfo.id) || []),
          //   transfer,
          // ]);
          return coinInfo.id;
        }
      }
    }).filter(a => a?.length))]

    if (ids.length === 0) return
    // console.log({ids})

    const parameters = `?ids=${ids.join(',')}&vs_currencies=usd`;
    const resp = await window.fetch(COINGECKO_COIN_PRICE_API + parameters);
    const usdByCoidId = await resp.json();
    // console.log("what is usdByCoidId?", {usdByCoidId})
    // let totalInUSD = 0;

    transfers.forEach(transfer => {
      transfer.price = usdByCoidId[transfer.coinId as string]?.usd || 1
      transfer.value = Math.round(transfer.amount * (transfer.price || 1) * 100) / 100
    })

    // Object.keys(usdByCoidId).forEach(key => {
    // let transfers = transfersByCoinId.get(key);

    // if (!transfers) {
    //   return;
    // }

    // transfers.forEach(asset => {
    //   asset.price = usdByCoidId[key]?.usd || 1;
    //   asset.amountInUSD =
    //     Math.round(asset.amount * (asset.price || 1) * 100) / 100;
    //   totalInUSD += asset.amountInUSD;
    // });
    // });

    setAmountInUSD(10);

    coingeckoTimer.current = window.setTimeout(
      () => dataSourcePriceQuery(),
      COINGECKO_POOL_INTERVAL,
    );
  }, [transfers, setAmountInUSD]);

  useEffect(() => {
    if (transfers && coinList && !loading) {
      dataSourcePriceQuery();
    }
    return () => {
      window.clearTimeout(coingeckoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transfers, coinList, loading]);

  return {
    loading,
    transfers,
    totalInUSD: amountInUSD,
  };
};
