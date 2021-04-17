import { Table } from 'antd';
import React from 'react';

import './index.less';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import { Link } from 'react-router-dom';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';
import {
  formatUSD,
  shortenAddress,
  EtherscanLink,
  ExplorerLink,
  Identicon,
} from '@oyster/common';
import { useWormholeTransactions } from '../../hooks/useWormholeTransactions';
import { ASSET_CHAIN } from '../../utils/assets';
import { TokenChain } from '../TokenDisplay/tokenChain';
import bs58 from 'bs58';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

export const RecentTransactionsTable = () => {
  const { loading: loadingTransfers, transfers } = useWormholeTransactions();

  const columns = [
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
        return {
          props: { style: {} },
          children: record.symbol ? (
            <Link
              to={`/move?from=${toChainSymbol(record.chain)}&token=${
                record.symbol
              }`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.symbol}
              </span>
            </Link>
          ) : record.lockup.assetChain === ASSET_CHAIN.Solana ? (
            <ExplorerLink
              address={record.address}
              length={5}
              type={'address'}
            />
          ) : (
            <EtherscanLink
              address={record.address}
              type={'address'}
              length={5}
            />
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
  return (
    <div id={'recent-tx-container'}>
      <div className={'home-subtitle'} style={{ marginBottom: '70px' }}>
        Recent Transactions
      </div>
      <Table
        scroll={{
          scrollToFirstRowOnChange: false,
          x: 900,
        }}
        dataSource={transfers.sort((a, b) => b.date - a.date)}
        columns={columns}
        loading={loadingTransfers}
      />
    </div>
  );
};
