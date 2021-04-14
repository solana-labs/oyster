import { Table } from 'antd';
import React from 'react';

import './index.less';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import { Link } from 'react-router-dom';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';
import { formatUSD, shortenAddress } from '@oyster/common';
import { useWormholeTransactions } from '../../hooks/useWormholeTransactions';

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
          children: (
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
          children: (
            <Link
              to={`/move?from=${toChainSymbol(record.chain)}&token=${
                record.symbol
              }`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.symbol}
              </span>
            </Link>
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
          children: <span className={`${text.toLowerCase()}`}>{text}</span>,
        };
      },
    },
  ];
  return (
    <div id={'recent-tx-container'}>
      <div className={'home-subtitle'}>Recent Transactions</div>
      <div className={'description-text'} style={{ marginBottom: '70px' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
      <Table
        scroll={{
          scrollToFirstRowOnChange: false,
          x: 900,
        }}
        dataSource={transfers
          .filter(a => a.symbol)
          .sort((a, b) => b.date - a.date)}
        columns={columns}
        loading={loadingTransfers}
      />
    </div>
  );
};
