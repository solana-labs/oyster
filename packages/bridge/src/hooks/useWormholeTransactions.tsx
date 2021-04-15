import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection, useConnectionConfig, programIds } from '@oyster/common';
import { WORMHOLE_PROGRAM_ID, POSTVAA_INSTRUCTION } from '../utils/ids';
import { ASSET_CHAIN } from '../utils/assets';
import { useEthereum } from '../contexts';
import {
  Connection,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  PublicKey,
} from '@solana/web3.js';
import {
  bridgeAuthorityKey,
  TransferOutProposalLayout,
} from './../models/bridge';

import bs58 from 'bs58';
import {
  COINGECKO_COIN_PRICE_API,
  COINGECKO_POOL_INTERVAL,
  useCoingecko,
} from '../contexts/coingecko';
import { BN } from 'bn.js';
import { WormholeFactory } from '../contracts/WormholeFactory';
import { ethers } from 'ethers';
import { useBridge } from '../contexts/bridge';
import { SolanaBridge } from '../core';

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
  explorer?: any;

  logo?: string;
  symbol?: string;
  amount: number;
  value?: number | string;
  txhash?: string;
  date: number; // timestamp
  status?: string;
  lockup?: any;
  vaa?: any;
};

const queryWrappedMetaTransactions = async (
  authorityKey: PublicKey,
  connection: Connection,
  setTransfers: (arr: WrappedTransferMeta[]) => void,
  provider: ethers.providers.Web3Provider,
  bridge?: SolanaBridge,
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
          lockup: metaTransfer,
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

            if (
              data[0] === POSTVAA_INSTRUCTION &&
              confirmedTx.meta?.err == null &&
              bridge
            ) {
              const lockup = transfer.lockup;
              let vaa = lockup.vaa;
              for (let i = vaa.length; i > 0; i--) {
                if (vaa[i] == 0xff) {
                  vaa = vaa.slice(0, i);
                  break;
                }
              }
              let signatures = await bridge.fetchSignatureStatus(
                lockup.signatureAccount,
              );
              let sigData = Buffer.of(
                ...signatures.reduce((previousValue, currentValue) => {
                  previousValue.push(currentValue.index);
                  previousValue.push(...currentValue.signature);

                  return previousValue;
                }, new Array<number>()),
              );

              vaa = Buffer.concat([
                vaa.slice(0, 5),
                Buffer.of(signatures.length),
                sigData,
                vaa.slice(6),
              ]);
              try {
                const signer = provider?.getSigner();
                let wh = WormholeFactory.connect(
                  programIds().wormhole.bridge,
                  signer,
                );
                if (vaa?.length) {
                  const result = await wh.parseAndVerifyVAA(vaa);
                  console.log({ result });
                  transfer.status = 'Failed';
                  transfer.vaa = vaa;
                  //TODO: handle vaa not posted
                } else {
                  console.log({ vaa });
                  transfer.status = 'Error';
                  transfer.vaa = vaa;
                  //TODO: handle empty data
                }
              } catch (e) {
                console.log({ error: e });
                transfer.vaa = vaa;
                transfer.status = 'Completed';
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
  const bridge = useBridge();

  const [loading, setLoading] = useState<boolean>(true);
  const [transfers, setTransfers] = useState<WrappedTransferMeta[]>([]);
  const [amountInUSD, setAmountInUSD] = useState<number>(0);

  useEffect(() => {
    setLoading(true);

    let wormholeSubId = 0;
    (async () => {
      // authority -> query for token accounts to get locked assets
      let authorityKey = await bridgeAuthorityKey(programIds().wormhole.pubkey);

      // query wrapped assets that were imported to solana from other chains
      queryWrappedMetaTransactions(
        authorityKey,
        connection,
        setTransfers,
        new ethers.providers.Web3Provider((window as any).ethereum),
        bridge,
      ).then(() => setLoading(false));
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
            }

            let token = ethTokens.get(`0x${transfer.address || ''}`);
            if (token) {
              transfer.logo = token.logoURI;
              transfer.symbol = token.symbol;
            }
            if (transfer.symbol) {
              let coinInfo = coinList.get(transfer.symbol.toLowerCase());
              if (coinInfo) {
                transfer.coinId = coinInfo.id;
                return coinInfo.id;
              }
            }
            return '';
          })
          .filter(a => a?.length),
      ),
    ];

    if (ids.length === 0) return;

    const parameters = `?ids=${ids.join(',')}&vs_currencies=usd`;
    const resp = await window.fetch(COINGECKO_COIN_PRICE_API + parameters);
    const usdByCoinId = await resp.json();

    transfers.forEach(transfer => {
      transfer.price = usdByCoinId[transfer.coinId as string]?.usd || 1;
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
