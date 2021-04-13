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
import { WORMHOLE_PROGRAM_ID, POSTVAA_INSTRUCTION } from '../utils/ids';
import { ASSET_CHAIN } from '../utils/assets';
import { useEthereum } from '../contexts';
import {
  Connection,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  PublicKey,
} from '@solana/web3.js';
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
import { ClaimedVAA } from '../models/bridge/claim';

interface ParsedData {
  info: any;
  type: string;
}

type WrappedTransferMeta = {
  chain: number;
  decimals: number;
  address: string;
  publicKey: PublicKey;

  coinId?: string;
  price?: number;
  explorer?: string;

  logo?: string;
  symbol?: string;
  amount: number;
  value?: number | string;
  txhash?: string;
  date: number; // timestamp
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
  ];

  const resp = await (connection as any)._rpcRequest('getProgramAccounts', [
    WORMHOLE_PROGRAM_ID.toBase58(),
    {
      commitment: connection.commitment,
      filters,
    },
  ]);

  const transfers = new Map<string, WrappedTransferMeta>();

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
      console.log(acc.account.data.length, TransferOutProposalLayout.span);
      if (acc.account.data.length === TransferOutProposalLayout.span) {
        const metaTransfer = TransferOutProposalLayout.decode(acc.account.data);

        let assetAddress: string = '';
        if (metaTransfer.assetChain !== ASSET_CHAIN.Solana) {
          assetAddress = Buffer.from(
            metaTransfer.assetAddress.slice(12),
          ).toString('hex');
        } else {
          assetAddress = new PublicKey(metaTransfer.assetAddress).toBase58();
        }

        const dec = new BN(10).pow(new BN(metaTransfer.assetDecimals));
        const rawAmount = new BN(metaTransfer.amount, 2, 'le');
        const amount = rawAmount.div(dec).toNumber();
        const txhash = acc.publicKey.toBase58();

        transfers.set(assetAddress, {
          publicKey: acc.publicKey,
          amount,
          date: metaTransfer.vaaTime,
          chain: metaTransfer.assetChain,
          address: assetAddress,
          decimals: 9,
          txhash,
          explorer: `https://explorer.solana.com/address/${txhash}`,
        });
      }
      return null;
    });

  await Promise.all(
    [...transfers.values()].map(async transfer => {
      const resp = await (connection as any)._rpcRequest(
        'getConfirmedSignaturesForAddress2',
        [transfer.publicKey.toBase58()],
      );

      for (const sig of resp.result) {
        const confirmedTx = await connection.getParsedConfirmedTransaction(
          sig.signature,
        );
        if (!confirmedTx) continue;
        const instructions = confirmedTx.transaction?.message?.instructions;
        const filteredInstructions = instructions?.filter(ins => {
          return ins.programId.toBase58() === WORMHOLE_PROGRAM_ID.toBase58();
        });
        if (filteredInstructions && filteredInstructions?.length > 0) {
          for (const ins of filteredInstructions) {
            const data = bs58.decode((ins as PartiallyDecodedInstruction).data);

            //console.log(confirmedTx)
            if (
              data[0] == POSTVAA_INSTRUCTION &&
              confirmedTx.meta?.err == null
            ) {
              const innerInstructions = confirmedTx.meta?.innerInstructions;
              if (innerInstructions?.length) {
                //console.log(innerInstructions, confirmedTx, transfer.publicKey.toBase58())
                const parsedData: ParsedData = ((innerInstructions[0]
                  .instructions[0] as ParsedInstruction)
                  .parsed as unknown) as ParsedData;

                const resp = await connection.getAccountInfo(
                  new PublicKey(parsedData.info.newAccount),
                  connection.commitment,
                );
                const accData = resp?.data;
                console.log(
                  accData,
                  ClaimedVAA.span,
                  accData?.length,
                  resp,
                  parsedData.info.newAccount,
                );
                if (accData?.length === ClaimedVAA.span) {
                  const metaTransfer = ClaimedVAA.decode(accData);
                  console.log(metaTransfer);
                  console.log(Buffer.from(metaTransfer.hash).toString('hex'));
                }
              } else {
                //TODO: handle empty instructions
              }
            }
          }
        }
      }
    }),
  );

  setTransfers([...transfers.values()]);
};

export const useWormholeTransactions = () => {
  const connection = useConnection();
  const { tokenMap: ethTokens } = useEthereum();
  const { tokenMap } = useConnectionConfig();
  const { coinList } = useCoingecko();

  const [loading, setLoading] = useState<boolean>(true);
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
      queryWrappedMetaTransactions(
        authorityKey,
        connection,
        setTransfers,
      ).then(() => setLoading(false));

      // listen to solana accounts for updates
      // wormholeSubId = connection.onProgramAccountChange(
      //   WORMHOLE_PROGRAM_ID,
      //   info => {
      //     if (info.accountInfo.data.length === TransferOutProposalLayout.span) {
      //       // TODO: check if new account and update external assets
      //     }
      //   },
      // );
    })();

    return () => {
      connection.removeProgramAccountChangeListener(wormholeSubId);
    };
  }, [connection, setTransfers]);

  const coingeckoTimer = useRef<number>(0);
  const dataSourcePriceQuery = useCallback(async () => {
    if (transfers.length === 0) return;

    const ids = [
      ...new Set(
        transfers
          .map(transfer => {
            let knownToken = tokenMap.get(transfer.address);
            if (knownToken) {
              transfer.logo = knownToken.logoURI;
              transfer.symbol = knownToken.symbol;
              // transfer.name = knownToken.name;
            }

            let token = ethTokens.get(`0x${transfer.address || ''}`);
            if (token) {
              transfer.logo = token.logoURI;
              transfer.symbol = token.symbol;
              // transfer.name = token.name;
            }

            if (transfer.symbol) {
              let coinInfo = coinList.get(transfer.symbol.toLowerCase());

              if (coinInfo) {
                transfer.coinId = coinInfo.id;
                return coinInfo.id;
              }
            }
          })
          .filter(a => a?.length),
      ),
    ];

    if (ids.length === 0) return;

    const parameters = `?ids=${ids.join(',')}&vs_currencies=usd`;
    const resp = await window.fetch(COINGECKO_COIN_PRICE_API + parameters);
    const usdByCoidId = await resp.json();

    transfers.forEach(transfer => {
      transfer.price = usdByCoidId[transfer.coinId as string]?.usd || 1;
      transfer.value =
        Math.round(transfer.amount * (transfer.price || 1) * 100) / 100;
    });

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
