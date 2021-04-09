import React, { useEffect, useState } from 'react';
import { notification, Spin, Button } from 'antd';
import {
  contexts,
  ConnectButton,
  programIds,
  notify,
  cache,
  useUserAccounts,
} from '@oyster/common';
import { Input } from '../Input';

import './style.less';
import { ASSET_CHAIN, chainToName } from '../../utils/assets';
import {
  bridgeAuthorityKey,
  displayBalance,
  fromSolana,
  ProgressUpdate,
  toSolana,
  TransferRequest,
  wrappedAssetMintKey,
} from '../../models/bridge';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from '../TokenDisplay';
import { WrappedAssetFactory } from '../../contracts/WrappedAssetFactory';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import BN from 'bn.js';
import { useTokenChainPairState } from '../../contexts/chainPair';
import { LABELS } from '../../constants';
import { useCorrectNetwork } from '../../hooks/useCorrectNetwork';
import { BigNumber } from 'ethers/utils';
import { RecentTransactionsTable } from '../RecentTransactionsTable';

const { useConnection } = contexts.Connection;
const { useWallet } = contexts.Wallet;

export const typeToIcon = (type: string, isLast: boolean) => {
  const style: React.CSSProperties = { marginRight: 5 };
  switch (type) {
    case 'user':
      return <span style={style}>🪓 </span>;
    case 'done':
      return <span style={style}>✅ </span>;
    case 'error':
      return <span style={style}>❌ </span>;
    case 'wait':
      return isLast ? <Spin /> : <span style={style}> ✅ </span>;
    default:
      return null;
  }
};

export const Transfer = () => {
  const connection = useConnection();
  const { wallet, connected } = useWallet();
  const { provider, tokenMap } = useEthereum();
  const hasCorrespondingNetworks = useCorrectNetwork();
  const {
    A,
    B,
    mintAddress,
    setMintAddress,
    setLastTypedAccount,
  } = useTokenChainPairState();
  const [request, setRequest] = useState<TransferRequest>({
    from: ASSET_CHAIN.Ethereum,
    to: ASSET_CHAIN.Solana,
  });

  useEffect(() => {
    if (mintAddress && !request.asset) {
      setRequest({
        ...request,
        asset: mintAddress,
      });
    }
  }, [mintAddress]);

  const setAssetInformation = async (asset: string) => {
    setMintAddress(asset);
  };

  useEffect(() => {
    setRequest({
      ...request,
      amount: A.amount,
      asset: mintAddress,
      from: A.chain,
      to: B.chain,
      info: A.info,
    });
  }, [A, B, mintAddress]);

  return (
    <>
      <div className="exchange-card">
        <Input
          title={`From`}
          asset={request.asset}
          balance={displayBalance(A.info)}
          setAsset={asset => setAssetInformation(asset)}
          chain={A.chain}
          amount={A.amount}
          onChain={(chain: ASSET_CHAIN) => {
            const from = A.chain;
            A.setChain(chain);
            B.setChain(from);
          }}
          onInputChange={amount => {
            setLastTypedAccount(A.chain);
            A.setAmount(amount || 0);
          }}
          className={'left'}
        />
        <Button
          type="primary"
          className="swap-button"
          style={{ padding: 0 }}
          disabled={false}
          onClick={() => {
            const from = A.chain;
            const toChain = B.chain;
            if (from !== undefined && toChain !== undefined) {
              A.setChain(toChain);
              B.setChain(from);
            }
          }}
        >
          <span></span>
        </Button>
        <Input
          title={`To`}
          asset={request.asset}
          balance={displayBalance(B.info)}
          setAsset={asset => setAssetInformation(asset)}
          chain={B.chain}
          amount={B.amount}
          onChain={(chain: ASSET_CHAIN) => {
            const to = B.chain;
            B.setChain(chain);
            A.setChain(to);
          }}
          onInputChange={amount => {
            setLastTypedAccount(B.chain);
            B.setAmount(amount || 0);
          }}
          className={'right'}
        />
      </div>

      <Button
        className={'transfer-button'}
        type="primary"
        size="large"
        disabled={!(A.amount && B.amount) || !connected || !provider}
        onClick={async () => {
          if (!wallet || !provider) {
            return;
          }

          const token = tokenMap.get(request.asset?.toLowerCase() || '');
          const NotificationContent = () => {
            const [activeSteps, setActiveSteps] = useState<ProgressUpdate[]>(
              [],
            );
            useEffect(() => {
              (async () => {
                let steps: ProgressUpdate[] = [];
                try {
                  if (request.from === ASSET_CHAIN.Solana) {
                    await fromSolana(
                      connection,
                      wallet,
                      request,
                      provider,
                      update => {
                        if (update.replace) {
                          steps.pop();
                          steps = [...steps, update];
                        } else {
                          steps = [...steps, update];
                        }

                        setActiveSteps(steps);
                      },
                    );
                  }

                  if (request.to === ASSET_CHAIN.Solana) {
                    await toSolana(
                      connection,
                      wallet,
                      request,
                      provider,
                      update => {
                        if (update.replace) {
                          steps.pop();
                          steps = [...steps, update];
                        } else {
                          steps = [...steps, update];
                        }

                        setActiveSteps(steps);
                      },
                    );
                  }
                } catch (err) {
                  // TODO...
                  console.log(err);
                }
              })();
            }, [setActiveSteps]);

            return (
              <div>
                <div style={{ display: 'flex' }}>
                  <div>
                    <h5>{`${chainToName(request.from)} Mainnet -> ${chainToName(
                      request.to,
                    )} Mainnet`}</h5>
                    <h2>
                      {request.amount?.toString()} {request.info?.name}
                    </h2>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      marginLeft: 'auto',
                      marginRight: 10,
                    }}
                  >
                    <TokenDisplay
                      asset={request.asset}
                      chain={request.from}
                      token={token}
                    />
                    <span style={{ margin: 15 }}>{'➔'}</span>
                    <TokenDisplay
                      asset={request.asset}
                      chain={request.to}
                      token={token}
                    />
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {(() => {
                    let group = '';
                    return activeSteps.map((step, i) => {
                      let prevGroup = group;
                      group = step.group;
                      let newGroup = prevGroup !== group;
                      return (
                        <>
                          {newGroup && <span>{group}</span>}
                          <span style={{ marginLeft: 15 }}>
                            {typeToIcon(
                              step.type,
                              activeSteps.length - 1 === i,
                            )}{' '}
                            {step.message}
                          </span>
                        </>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          };

          notification.open({
            message: '',
            duration: 0,
            placement: 'bottomLeft',
            description: <NotificationContent />,
            className: 'custom-class',
            style: {
              width: 500,
            },
          });
        }}
      >
        {hasCorrespondingNetworks
          ? !(A.amount && B.amount)
            ? LABELS.ENTER_AMOUNT
            : LABELS.TRANSFER
          : LABELS.SET_CORRECT_WALLET_NETWORK}
      </Button>
      <RecentTransactionsTable />
    </>
  );
};
