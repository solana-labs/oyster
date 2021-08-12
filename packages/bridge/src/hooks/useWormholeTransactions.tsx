import { useCallback, useEffect, useRef, useState } from 'react';
import {
  notify,
  programIds,
  TokenAccount,
  useConnection,
  useConnectionConfig,
  useUserAccounts,
} from '@oyster/common';
import {
  POSTVAA_INSTRUCTION,
  TRANSFER_ASSETS_OUT_INSTRUCTION,
  WORMHOLE_PROGRAM_ID,
} from '../utils/ids';
import { ASSET_CHAIN } from '../utils/assets';
import { useEthereum } from '../contexts';
import {
  AccountInfo,
  Connection,
  ParsedAccountData,
  PartiallyDecodedInstruction,
  PublicKey,
  RpcResponseAndContext,
} from '@solana/web3.js';
import {
  bridgeAuthorityKey,
  LockupStatus,
  LockupWithStatus,
  SolanaBridge,
  TransferOutProposalLayout,
  WormholeFactory,
} from '@solana/bridge-sdk';

import bs58 from 'bs58';
import {
  COINGECKO_COIN_PRICE_API,
  COINGECKO_POOL_INTERVAL,
  useCoingecko,
} from '../contexts/coingecko';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import { useBridge } from '../contexts/bridge';
import BN from 'bn.js';
import { keccak256 } from 'ethers/utils';

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
  txhash: string;
  date: number; // timestamp
  status?: string;
  owner?: string;
  lockup?: any;
  vaa?: any;
};

const transferCache = new Map<string, WrappedTransferMeta>();

const queryOwnWrappedMetaTransactions = async (
  authorityKey: PublicKey,
  connection: Connection,
  setTransfers: (arr: WrappedTransferMeta[]) => void,
  provider: ethers.providers.Web3Provider,
  tokenAccounts: TokenAccount[],
  bridge?: SolanaBridge,
) => {
  if (tokenAccounts && tokenAccounts.length > 0 && bridge) {
    const transfers = new Map<string, WrappedTransferMeta>();
    let wh = WormholeFactory.connect(programIds().wormhole.bridge, provider);

    let lockups: LockupWithStatus[] = [];
    for (const acc of tokenAccounts) {
      const accLockups = await bridge.fetchTransferProposals(acc.pubkey);
      lockups.push(
        ...accLockups.map(v => {
          return {
            status: LockupStatus.AWAITING_VAA,
            ...v,
          };
        }),
      );
      for (let lockup of lockups) {
        if (lockup.vaaTime === undefined || lockup.vaaTime === 0) continue;

        let signingData = lockup.vaa.slice(lockup.vaa[5] * 66 + 6);
        for (let i = signingData.length; i > 0; i--) {
          if (signingData[i] == 0xff) {
            signingData = signingData.slice(0, i);
            break;
          }
        }
        let hash = keccak256(signingData);
        let submissionStatus = await wh.consumedVAAs(hash);

        lockup.status = submissionStatus
          ? LockupStatus.COMPLETED
          : LockupStatus.UNCLAIMED_VAA;
      }
    }
    for (const ls of lockups) {
      const txhash = ls.lockupAddress.toBase58();
      let assetAddress: string = '';
      if (ls.assetChain !== ASSET_CHAIN.Solana) {
        assetAddress = Buffer.from(ls.assetAddress.slice(12)).toString('hex');
      } else {
        assetAddress = new PublicKey(ls.assetAddress).toBase58();
      }
      const dec = new BigNumber(10).pow(new BigNumber(ls.assetDecimals));
      const rawAmount = new BigNumber(ls.amount.toString());
      const amount = rawAmount.div(dec).toNumber();
      transfers.set(txhash, {
        publicKey: ls.lockupAddress,
        amount,
        date: ls.vaaTime,
        chain: ls.assetChain,
        address: assetAddress,
        decimals: 9,
        txhash,
        explorer: `https://explorer.solana.com/address/${txhash}`,
        lockup: ls,
        status:
          ls.status === LockupStatus.UNCLAIMED_VAA
            ? 'Failed'
            : ls.status === LockupStatus.AWAITING_VAA
            ? 'In Process'
            : 'Completed',
      });
    }
    setTransfers([...transfers.values()]);
  }
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

  let wh = WormholeFactory.connect(programIds().wormhole.bridge, provider);
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

        const dec = new BigNumber(10).pow(
          new BigNumber(metaTransfer.assetDecimals),
        );
        const rawAmount = new BigNumber(
          new BN(metaTransfer.amount, 2, 'le').toString(),
        );
        const amount = rawAmount.div(dec).toNumber();
        const txhash = acc.publicKey.toBase58();

        transfers.set(txhash, {
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
      const cachedTransfer = transferCache.get(transfer.txhash);
      if (cachedTransfer && cachedTransfer.status === 'Completed') {
        transfer.vaa = cachedTransfer.vaa;
        transfer.status = cachedTransfer.status;
        transfer.owner = cachedTransfer.owner;
      } else {
        const resp = await (connection as any)._rpcRequest(
          'getConfirmedSignaturesForAddress2',
          [transfer.publicKey.toBase58()],
        );

        for (const sig of resp.result) {
          const confirmedTx = await connection.getParsedConfirmedTransaction(
            sig.signature,
            'finalized',
          );
          if (!confirmedTx) continue;
          const instructions = confirmedTx.transaction?.message?.instructions;
          const filteredInstructions = instructions?.filter(ins => {
            return ins.programId.toBase58() === WORMHOLE_PROGRAM_ID.toBase58();
          });
          if (filteredInstructions && filteredInstructions?.length > 0) {
            for (const ins of filteredInstructions) {
              const data = bs58.decode(
                (ins as PartiallyDecodedInstruction).data,
              );
              if (data[0] === TRANSFER_ASSETS_OUT_INSTRUCTION) {
                try {
                  transfer.owner = (ins as PartiallyDecodedInstruction).accounts[10].toBase58();
                } catch {
                  // Catch no owner
                  transfer.owner = '';
                }
              }

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
                try {
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
                    if (vaa?.length) {
                      const _ = await wh.parseAndVerifyVAA(vaa);
                      transfer.status = 'Failed';
                      transfer.vaa = vaa;
                      //TODO: handle vaa not posted
                      //console.log({ result });
                    } else {
                      transfer.status = 'Error';
                      transfer.vaa = vaa;
                      //TODO: handle empty data
                      //console.log({ vaa });
                    }
                  } catch (e) {
                    //console.log({ error: e });
                    transfer.vaa = vaa;
                    transfer.status = 'Completed';
                    transferCache.set(transfer.txhash, transfer);
                  }
                } catch (e) {
                  transfer.status = 'Error';
                  transfer.vaa = vaa;
                  //TODO: handle error
                }
              }
            }
          }
        }
      }
    }),
  );

  setTransfers([...transfers.values()]);
};

export const useWormholeTransactions = (tokenAccounts: TokenAccount[]) => {
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

    (async () => {
      // authority -> query for token accounts to get locked assets
      let authorityKey = await bridgeAuthorityKey(programIds().wormhole.pubkey);
      if ((window as any).ethereum === undefined) {
        notify({
          message: 'Metamask Error',
          description: 'Please install metamask wallet extension',
        });
        setLoading(false);
      } else {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum,
        );
        // query wrapped assets that were imported to solana from other chains
        queryOwnWrappedMetaTransactions(
          authorityKey,
          connection,
          setTransfers,
          provider,
          tokenAccounts,
          bridge,
        ).then(() => setLoading(false));
      }
    })();
  }, [connection, setTransfers, tokenAccounts]);

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

    console.log('Querying Prices...');
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
  }, [transfers, setAmountInUSD, coinList]);

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
