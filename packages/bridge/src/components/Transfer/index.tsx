import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, notification, Spin, Button } from 'antd';
import { TokenInfo } from '@uniswap/token-lists';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LABELS } from '../../constants';
import {
  contexts,
  utils,
  ConnectButton,
  programIds,
  formatAmount,
} from '@oyster/common';
import { useHistory, useLocation } from 'react-router-dom';
import { EthereumInput } from './../Input';

import './style.less';
import { ethers } from 'ethers';
import { ASSET_CHAIN, chainToName } from '../../utils/assets';
import { BigNumber } from 'ethers/utils';
import { Erc20Factory } from '../../contracts/Erc20Factory';
import { ProgressUpdate, transfer, TransferRequest } from '../../models/bridge';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from './../TokenDisplay';

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
  const { wallet } = useWallet();
  const { provider, tokenMap, tokens } = useEthereum();
  const [request, setRequest] = useState<TransferRequest>({
    asset: tokens?.[0]?.address,
    from: ASSET_CHAIN.Ethereum,
    toChain: ASSET_CHAIN.Solana,
  });

  const setAssetInformation = (asset: string) => {
    setRequest({
      ...request,
      asset,
    });
  };

  return (
    <>
      <div className="exchange-card">
        <EthereumInput
          title="From Ethereum"
          setInfo={info => {
            request.info = info;
          }}
          asset={request.asset}
          chain={request.from}
          setAsset={asset => setAssetInformation(asset)}
          amount={request.amount}
          onInputChange={amount => {
            setRequest({
              ...request,
              amount: amount || 0,
            });
          }}
        />
        <Button
          type="primary"
          className="swap-button"
          disabled={true}
          onClick={() => {
            const from = request.toChain;
            const toChain = request.from;
            setRequest({
              ...request,
              from,
              toChain,
            });
          }}
        >
          ⇅
        </Button>
        <EthereumInput
          title="To Solana"
          setInfo={info => {
            request.info = info;
          }}
          asset={request.asset}
          chain={request.toChain}
          hideBalance={true}
          setAsset={asset => setAssetInformation(asset)}
          amount={request.amount}
          onInputChange={amount => {
            setRequest({
              ...request,
              amount: amount || 0,
            });
          }}
        />
      </div>
      <ConnectButton
        type="primary"
        onClick={async () => {
          if (!wallet || !provider) {
            return;
          }

          const NotificationContent = () => {
            const [activeSteps, setActiveSteps] = useState<ProgressUpdate[]>(
              [],
            );
            useEffect(() => {
              (async () => {
                let steps: ProgressUpdate[] = [];
                try {
                  await transfer(
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
                } catch {
                  // TODO...
                }
              })();
            }, [setActiveSteps]);

            return (
              <div>
                <div style={{ display: 'flex' }}>
                  <div>
                    <h5>{`${chainToName(request.from)} Mainnet -> ${chainToName(
                      request.from,
                    )} Mainnet`}</h5>
                    <h2>
                      {formatAmount(request.amount || 0, 2)}{' '}
                      {request.info?.name}
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
                      token={tokenMap.get(request.asset || '')}
                    />
                    <span style={{ margin: 15 }}>{'➔'}</span>
                    <TokenDisplay
                      asset={request.asset}
                      chain={request.toChain}
                      token={tokenMap.get(request.asset || '')}
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
        Transfer
      </ConnectButton>
    </>
  );
};
