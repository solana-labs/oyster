import { Table, Col, Row, Statistic, Button } from 'antd';
import React, { useMemo } from 'react';
import { GUTTER } from '../../constants';
import { formatNumber, formatUSD, shortenAddress } from '@oyster/common';
import './itemStyle.less';
import './index.less';
import { Link } from 'react-router-dom';
import { useWormholeAccounts } from '../../hooks/useWormholeAccounts';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';

export const HomeView = () => {
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
  const s = () => {
    return true;
  };
  return (
    <>
      <div className="flexColumn home-container wormhole-bg">
        <div className={'justify-bottom-container'}>
          <div>
            A decentralized and bi-directional bridge for
            <br /> ERC-20 and SPL tokens
          </div>
          <div className={'grow-effect'}>
            <Link to="/move">
              <span className={'get-started'}></span>
            </Link>
          </div>
          <div className={'grow-effect'}>
            <span className={'down-arrow'}></span>
          </div>
        </div>
        <div style={{ height: '500px', background: '#0D1B28' }}></div>
        {/*<Table*/}
        {/*  dataSource={transfers.filter(a => a.symbol)}*/}
        {/*  columns={columns}*/}
        {/*  loading={loadingLockedAccounts}*/}
        {/*/>*/}
      </div>
    </>
  );
};
