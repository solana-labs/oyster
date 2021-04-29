import { Table } from 'antd';
import React from 'react';

import './index.less';
import { Link } from 'react-router-dom';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';
import { formatUSD, shortenAddress } from '@oyster/common';
import { useWormholeAccounts } from '../../hooks/useWormholeAccounts';

export const AssetsTable = () => {
  const {
    loading: loadingLockedAccounts,
    externalAssets,
    totalInUSD,
  } = useWormholeAccounts();

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render(text: string, record: any) {
        return {
          props: {
            style: {},
          },
          children: (
            <Link
              to={`/move?from=${toChainSymbol(record.chain)}&token=${
                record.symbol
              }`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.logo && (
                  <TokenDisplay logo={record.logo} chain={record.chain} />
                )}{' '}
                {record.symbol}
              </span>
            </Link>
          ),
        };
      },
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Amount ($)',
      dataIndex: 'amountInUSD',
      key: 'amountInUSD',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 100,
      key: 'price',
      render(text: string, record: any) {
        return {
          props: {
            style: { textAlign: 'right' },
          },
          children: record.price ? formatUSD.format(record.price) : '--',
        };
      },
    },
    {
      title: 'Asset Address',
      dataIndex: 'address',
      key: 'address',
      render(text: string, record: any) {
        return {
          props: {
            style: {},
          },
          children: (
            <a href={record.explorer} target="_blank" rel="noopener noreferrer">
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
    {
      title: 'Wrapped Address',
      dataIndex: 'mintKey',
      key: 'mintKey',
      render(text: string, record: any) {
        return {
          props: {
            style: {},
          },
          children: (
            <a
              href={record.wrappedExplorer}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
  ];

  return (
    <div id={'recent-tx-container'}>
      <div className={'home-subtitle'}>Total Value Locked</div>
      <div
        className={'assets-total description-text'}
        style={{ marginBottom: '70px', fontSize: '40px' }}
      >
        {formatUSD.format(totalInUSD)}
      </div>
      <Table
        scroll={{
          scrollToFirstRowOnChange: false,
          x: 900,
        }}
        dataSource={externalAssets.filter(a => a.name)}
        columns={columns}
        loading={loadingLockedAccounts}
      />
    </div>
  );
};
