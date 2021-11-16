import React, { useEffect, useMemo, useRef, useState } from 'react';
import { notification, Spin, Button, Popover } from 'antd';
import { contexts, useUserAccounts } from '@oyster/common';
import { Input } from '../Input';

import './style.less';
import { ASSET_CHAIN, chainToName } from '../../utils/assets';
import {
  displayBalance,
  fromSolana,
  ProgressUpdate,
  toSolana,
  TransferRequest,
} from '@solana/bridge-sdk';
import { getETHAccountBalance } from '@solana/bridge-sdk';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from '../TokenDisplay';
import { useTokenChainPairState } from '../../contexts/chainPair';
import { LABELS } from '../../constants';
import { useCorrectNetwork } from '../../hooks/useCorrectNetwork';
import { useUnload } from '../../hooks/useUnload';
import { RecentTransactionsTable } from '../RecentTransactionsTable';
import { useBridge } from '../../contexts/bridge';
import { WarningOutlined } from '@ant-design/icons';
import { BN } from 'bn.js';
import BigNumber from 'bignumber.js';

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
  const bridge = useBridge();
  const { wallet, connected } = useWallet();
  const { provider, tokenMap, signer, accounts } = useEthereum();
  const { userAccounts } = useUserAccounts();
  const hasCorrespondingNetworks = useCorrectNetwork();
  const { A, B, mintAddress, setMintAddress, setLastTypedAccount } =
    useTokenChainPairState();

  const [isEnoughtETHBalance, setIsEnoughtETHBalance] = useState(true);
  const [isEnoughtSOLBalance, setIsEnoughtSOLBalance] = useState(true);

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [transferStatus, setTransferStatus] = useState({ inProcess: false });
  const [warningChecked, setWarningChecked] = useState(false);
  const transferStateRef = useRef(transferStatus);
  transferStateRef.current = transferStatus;

  const [request, setRequest] = useState<TransferRequest>({
    from: ASSET_CHAIN.Ethereum,
    to: ASSET_CHAIN.Solana,
  });

  useEffect(() => {
    async function checkBalances() {
      if (
        !wallet ||
        !provider ||
        !wallet.publicKey ||
        !accounts ||
        !accounts.length
      ) {
        return;
      }

      let shouldOpenPopup = false;

      try {
        const SOL_DECIMAL = 9;
        const ADD_TOKEN_COST = 0.002039;
        const rawSOLBalance = await connection.getBalance(wallet.publicKey);
        const SOLBalance = rawSOLBalance / Math.pow(10, SOL_DECIMAL);

        if (SOLBalance < ADD_TOKEN_COST) {
          shouldOpenPopup = true;
          setIsEnoughtSOLBalance(false);
          // console.log('Warning: your SOL balance is too little')
        }
      } catch (e) {
        console.log(e);
      }

      try {
        const gweiCountInEachEth = `1000000000000000000`;
        const rawETHBalance = await getETHAccountBalance(accounts[0]);
        const ETHBalance = new BigNumber(rawETHBalance)
          .div(new BigNumber(gweiCountInEachEth))
          .toNumber();
        const cost = 0.1;

        if (ETHBalance < cost) {
          shouldOpenPopup = true;
          setIsEnoughtETHBalance(false);
          // console.log('Warning: your ETH balance is too little')
        }
      } catch (e) {
        console.log(e);
      }

      if (shouldOpenPopup) {
        setPopoverVisible(true);
      }
    }

    checkBalances();
  }, [
    wallet,
    connected,
    provider,
    accounts,
    isEnoughtSOLBalance,
    isEnoughtETHBalance,
  ]);

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
  }, [A, B, mintAddress, A.info]);

  const tokenAccounts = useMemo(
    () =>
      userAccounts.filter(u => u.info.mint.toBase58() === request.info?.mint),
    [request.info?.mint],
  );

  useUnload(e => {
    e.preventDefault();

    if (!transferStateRef.current.inProcess) {
      return;
    }

    const message = `Please do not leave transfering before it's complete, otherwise it might be a reason of losing funds due transfer`;
    e.returnValue = message;

    return message;
  });

  return (
    <>
      <Popover
        placement="bottom"
        title={
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => setPopoverVisible(false)}
          >
            x
          </span>
        }
        content={
          <span style={{ textAlign: 'center' }}>
            <WarningOutlined
              style={{ fontSize: '40px', color: '#ccae00', padding: '1.5rem' }}
            />
            {!isEnoughtETHBalance && (
              <p>
                Your ETH balance is less than 0.1, and it might be fine enough,
                however, <br />
                we recommend to have at least 0.1 ETH to be able to process
                transaction on Ethereum side, <br />
                since the gas for that transaction might be up to 0.1 ETH
              </p>
            )}
            {!isEnoughtSOLBalance && (
              <p>
                Your SOL balance is less than 0.002039, and it might be fine
                enough, however, <br />
                we recommend to have at least 0.002039 SOL to be able to process
                transaction on Solana side, <br />
                since you should create your RIN (ex. CCAI) token to recive the
                WWT token
              </p>
            )}
          </span>
        }
        visible={popoverVisible}
      />
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
            if (B.chain === chain) {
              B.setChain(from);
            }
          }}
          onInputChange={amount => {
            setLastTypedAccount(A.chain);
            A.setAmount(amount || 0);
          }}
          className={'left'}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
         <Button
          className={'transfer-button'}
          type="primary"
          size="large"
          disabled={
            true
            // !(A.amount && B.amount) ||
            // !connected ||
            // !provider ||
            // transferStatus.inProcess ||
            // popoverVisible || !warningChecked
          }
          onClick={async () => {
            if (!wallet || !provider || !wallet.publicKey) {
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
                  setTransferStatus({ inProcess: true });
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
                        bridge,
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
                    setTransferStatus({ inProcess: false });
                  })();
                }, [setActiveSteps]);

              return (
                <div>
                  <div style={{ display: 'flex' }}>
                    <div>
                      <h5>{`${chainToName(
                          request.from,
                      )} Mainnet -> ${chainToName(request.to)} Mainnet`}</h5>
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
          <div style={{ marginTop: '10px' }}>
            <input
              type="checkbox"
              id={'warning_checkbox'}
              style={{ padding: 0, marginRight: '10px', outline: 'none' }}
              onChange={() => setWarningChecked(!warningChecked)}
              checked={warningChecked}
            />
            <label htmlFor={'warning_checkbox'}>
              <span style={{ fontSize: '10px' }}>
                I read the warning and understand the risks.
              </span>
            </label>
          </div>
        </div>
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
            if (A.chain === chain) {
              A.setChain(to);
            }
          }}
          onInputChange={amount => {
            setLastTypedAccount(B.chain);
            B.setAmount(amount || 0);
          }}
          className={'right'}
        />
      </div>
    </>
  );
};
