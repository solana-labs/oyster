import { Table, Col, Row, Statistic, Button } from 'antd';
import React from 'react';
import { GUTTER } from '../../constants';
import { formatNumber, formatUSD, shortenAddress } from '@oyster/common';
import './itemStyle.less';
import { Link } from 'react-router-dom';
import { useWormholeAccounts } from '../../hooks/useWormholeAccounts';
import { TokenDisplay } from '../../components/TokenDisplay';

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
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {record.logo && (
                <TokenDisplay logo={record.logo} chain={record.chain} />
              )}{' '}
              {record.symbol}
            </span>
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
            <a href={record.explorer} target="_blank">
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
            <a href={record.wrappedExplorer} target="_blank">
              {shortenAddress(text, 6)}
            </a>
          ),
        };
      },
    },
  ];

  return (
    <div className="flexColumn">
      <Row
        gutter={GUTTER}
        justify="center"
        align="middle"
        className="home-info-row"
      >
        <Col xs={24} xl={12} className="app-title">
          <h1>Wormhole</h1>
          <h2>
            <span>Ethereum + Solana Bridge</span>
          </h2>
          <Link to="/move">
            <Button className="app-action">Get Started</Button>
          </Link>
        </Col>
        <Col xs={24} xl={12}>
          <Statistic
            className="home-statistic"
            title={`$${formatNumber.format(totalInUSD)}`}
            value="TOTAL VALUE LOCKED"
          />
        </Col>
      </Row>
      <Table
        dataSource={externalAssets.filter(a => a.name)}
        columns={columns}
        loading={loadingLockedAccounts}
      />
    </div>
  );
};
