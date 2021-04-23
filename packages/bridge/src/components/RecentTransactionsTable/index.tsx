import { Button, Table, Tabs, notification } from 'antd';
import React, { useEffect, useState } from 'react';

import './index.less';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import { Link } from 'react-router-dom';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';
import {
  formatUSD,
  shortenAddress,
  Identicon,
  programIds,
} from '@oyster/common';
import { useWormholeTransactions } from '../../hooks/useWormholeTransactions';
import { ASSET_CHAIN } from '../../utils/assets';
import { TokenChain } from '../TokenDisplay/tokenChain';
import bs58 from 'bs58';
import { SyncOutlined } from '@ant-design/icons';
import { typeToIcon } from '../Transfer';
import { ProgressUpdate } from '../../models/bridge';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import { useEthereum } from '../../contexts';
import { useBridge } from '../../contexts/bridge';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

const { TabPane } = Tabs;

export const RecentTransactionsTable = (props: {
  showUserTransactions?: boolean;
}) => {
  const {
    loading: loadingTransfers,
    transfers,
    userTransfers,
  } = useWormholeTransactions();
  const { provider } = useEthereum();
  const bridge = useBridge();

  const [completedVAAs, setCompletedVAAs] = useState<Array<string>>([]);

  const baseColumns = [
    {
      title: '',
      dataIndex: 'logo',
      key: 'logo',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: record.logo ? (
            <Link
              to={`/move?from=${toChainSymbol(record.chain)}&token=${
                record.symbol
              }`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.logo && (
                  <TokenDisplay logo={record.logo} chain={record.chain} />
                )}
              </span>
            </Link>
          ) : (
            <div className="token-chain-logo">
              <Identicon
                style={{ width: '50' }}
                address={
                  record.chain === ASSET_CHAIN.Solana
                    ? record.address
                    : bs58.encode(Buffer.from(record.address))
                }
              />
              <TokenChain chain={record.chain} className={'chain-logo'} />
            </div>
          ),
        };
      },
    },
    {
      title: 'Asset',
      dataIndex: 'symbol',
      key: 'symbol',
      render(text: string, record: any) {
        const urlText = record.symbol || record.address;
        return {
          props: { style: {} },
          children:
            record.lockup.assetChain === ASSET_CHAIN.Solana ? (
              <a
                href={`https://explorer.solana.com/address/${record.address}`}
                // eslint-disable-next-line react/jsx-no-target-blank
                target="_blank"
                title={urlText}
              >
                {record.symbol || shortenAddress(urlText, 5)}
              </a>
            ) : (
              <a
                href={`https://etherscan.io/address/${record.address}`}
                // eslint-disable-next-line react/jsx-no-target-blank
                target="_blank"
                title={urlText}
              >
                {record.symbol || shortenAddress(urlText, 5)}
              </a>
            ),
        };
      },
    },
    {
      title: 'Tokens moved',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: '$, value',
      dataIndex: 'value',
      key: 'value',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: record.value ? formatUSD.format(record.value) : '--',
        };
      },
    },
    {
      title: 'TX hash',
      dataIndex: 'txhash',
      key: 'txhash',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <a href={record.explorer} target="_blank" rel="noopener noreferrer">
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: timeAgo.format(new Date(record.date * 1000)),
        };
      },
    },
  ];
  const columns = [
    ...baseColumns,
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <span className={`${record.status?.toLowerCase()}`}>
              {record.status}
            </span>
          ),
        };
      },
    },
  ];

  const userColumns = [
    ...baseColumns,
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(text: string, record: any) {
        const status =
          completedVAAs.indexOf(record.txhash) > 0
            ? 'Completed'
            : record.status;
        return {
          props: { style: {} },
          children: (
            <>
              <span className={`${record.status?.toLowerCase()}`}>
                {status}
              </span>
              {status === 'Failed' ? (
                <Button
                  onClick={() => {
                    const NotificationContent = () => {
                      const [activeSteps, setActiveSteps] = useState<
                        ProgressUpdate[]
                      >([]);
                      let counter = 0;
                      useEffect(() => {
                        (async () => {
                          const signer = provider?.getSigner();
                          if (!signer || !bridge) {
                            setActiveSteps([
                              ...activeSteps,
                              {
                                message: 'Connect your Ethereum Wallet',
                                type: 'error',
                                group: 'error',
                                step: counter++,
                              },
                            ]);
                          } else {
                            const lockup = record.lockup;
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
                              ...signatures.reduce(
                                (previousValue, currentValue) => {
                                  previousValue.push(currentValue.index);
                                  previousValue.push(...currentValue.signature);

                                  return previousValue;
                                },
                                new Array<number>(),
                              ),
                            );

                            vaa = Buffer.concat([
                              vaa.slice(0, 5),
                              Buffer.of(signatures.length),
                              sigData,
                              vaa.slice(6),
                            ]);
                            let wh = WormholeFactory.connect(
                              programIds().wormhole.bridge,
                              signer,
                            );
                            let group = 'Finalizing transfer';
                            setActiveSteps([
                              ...activeSteps,
                              {
                                message: 'Sign the claim...',
                                type: 'wait',
                                group,
                                step: counter++,
                              },
                            ]);
                            let tx = await wh.submitVAA(vaa);
                            setActiveSteps([
                              ...activeSteps,
                              {
                                message:
                                  'Waiting for tokens unlock to be mined...',
                                type: 'wait',
                                group,
                                step: counter++,
                              },
                            ]);
                            await tx.wait(1);
                            setActiveSteps([
                              ...activeSteps,
                              {
                                message: 'Execution of VAA succeeded',
                                type: 'done',
                                group,
                                step: counter++,
                              },
                            ]);
                          }
                        })();
                      }, [setActiveSteps]);

                      return (
                        <div>
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
                  shape="circle"
                  size="large"
                  type="text"
                  style={{ color: '#547595', fontSize: '18px' }}
                  title={'Retry Transaction'}
                  icon={<SyncOutlined />}
                />
              ) : null}
            </>
          ),
        };
      },
    },
  ];
  return (
    <div id={'recent-tx-container'}>
      <div className={'home-subtitle'} style={{ marginBottom: '70px' }}>
        Transactions
      </div>
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Recent Transactions" key="1">
          <Table
            scroll={{
              scrollToFirstRowOnChange: false,
              x: 900,
            }}
            dataSource={transfers.sort((a, b) => b.date - a.date)}
            columns={columns}
            loading={loadingTransfers}
          />
        </TabPane>
        <TabPane tab="My Transactions" key="2">
          <Table
            scroll={{
              scrollToFirstRowOnChange: false,
              x: 900,
            }}
            dataSource={userTransfers.sort((a, b) => b.date - a.date)}
            columns={userColumns}
            loading={loadingTransfers}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};
