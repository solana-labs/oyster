import React, { useEffect, useState } from 'react';
import { notification, Spin, Button } from 'antd';
import {
  contexts,
  ConnectButton,
  programIds,
  formatAmount,
} from '@oyster/common';
import { Input } from './../Input';

import './style.less';
import { ASSET_CHAIN, chainToName } from '../../utils/assets';
import { ProgressUpdate, toSolana, TransferRequest } from '../../models/bridge';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from './../TokenDisplay';
import { WrappedAssetFactory } from '../../contracts/WrappedAssetFactory';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import BN from 'bn.js';
import { useTokenChainPairState } from '../../contexts/chainPair';

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
  const {
    A,
    B,
    mintAddress,
    setMintAddress,
    setLastTypedAccount,
  } = useTokenChainPairState();
  const [request, setRequest] = useState<TransferRequest>({
    from: ASSET_CHAIN.Ethereum,
    toChain: ASSET_CHAIN.Solana,
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
    setRequest({
      ...request,
      asset: asset,
    });
  };

  useEffect(() => {
    setRequest({
      ...request,
      amount: A.amount,
      asset: mintAddress,
      from: A.chain,
      toChain: B.chain,
    });
  }, [A, B, mintAddress]);

  useEffect(() => {
    const asset = request.asset;
    if (!asset || asset === request?.info?.address) {
      return;
    }

    (async () => {
      if (!provider) {
        return;
      }

      const bridgeAddress = programIds().wormhole.bridge;

      let signer = provider.getSigner();
      let e = WrappedAssetFactory.connect(asset, provider);
      let addr = await signer.getAddress();
      let balance = await e.balanceOf(addr);
      let decimals = await e.decimals();
      let symbol = await e.symbol();

      let allowance = await e.allowance(addr, bridgeAddress);

      let info = {
        address: asset,
        name: symbol,
        balance: balance,
        balanceAsNumber:
          new BN(balance.toString())
            .div(new BN(10).pow(new BN(decimals - 2)))
            .toNumber() / 100,
        allowance: allowance,
        decimals: decimals,
        isWrapped: false,
        chainID: ASSET_CHAIN.Ethereum,
        assetAddress: Buffer.from(asset.slice(2), 'hex'),
        mint: '',
      };

      let b = WormholeFactory.connect(bridgeAddress, provider);

      let isWrapped = await b.isWrappedAsset(asset);
      if (isWrapped) {
        info.chainID = await e.assetChain();
        info.assetAddress = Buffer.from(
          (await e.assetAddress()).slice(2),
          'hex',
        );
        info.isWrapped = true;
      }

      setRequest({
        ...request,
        asset,
        info,
      });
    })();
  }, [request, provider]);

  return (
    <>
      <div className="exchange-card">
        <Input
          title={`From ${chainToName(request.from)}`}
          asset={request.asset}
          balance={request.info?.balanceAsNumber || 0}
          setAsset={asset => setAssetInformation(asset)}
          chain={A.chain}
          amount={A.amount}
          onInputChange={amount => {
            setLastTypedAccount(A.chain);
            A.setAmount(amount || 0);
          }}
        />
        <Button
          type="primary"
          className="swap-button"
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
          ⇅
        </Button>
        <Input
          title={`To ${chainToName(request.toChain)}`}
          asset={request.asset}
          setAsset={asset => setAssetInformation(asset)}
          chain={B.chain}
          amount={B.amount}
          onInputChange={amount => {
            setLastTypedAccount(B.chain);
            B.setAmount(amount || 0);
          }}
        />
      </div>
      <ConnectButton
        type="primary"
        onClick={async () => {
          if (!wallet || !provider) {
            return;
          }

          const token = tokenMap.get(request.asset?.toLowerCase() || '');
          debugger;
          const NotificationContent = () => {
            const [activeSteps, setActiveSteps] = useState<ProgressUpdate[]>(
              [],
            );
            useEffect(() => {
              (async () => {
                let steps: ProgressUpdate[] = [];
                try {
                  if (request.toChain === ASSET_CHAIN.Solana) {
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
                } catch {
                  // TODO...
                }
              })();
            }, [setActiveSteps]);

            return (
              <div>
                <div style={{ display: 'flex' }}>
                  <div>
                    <h5>{`${chainToName(request.from)} Mainnet -> ${chainToName(request.toChain)} Mainnet`}</h5>
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
                      chain={request.toChain}
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
        Transfer
      </ConnectButton>
    </>
  );
};
