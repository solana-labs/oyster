import { Table, Col, Row, Statistic, Button } from 'antd';
import React from 'react';
import { GUTTER } from '../../constants';
import { formatNumber, formatUSD, shortenAddress } from '@oyster/common';
import './itemStyle.less';
import { Link } from 'react-router-dom';
import { useWormholeTransactions } from '../../hooks/useWormholeTransactions';
import { TokenDisplay } from '../../components/TokenDisplay';
import { toChainSymbol } from '../../contexts/chainPair';

export const HomeView = () => {
  const {
    loading: loadingLockedAccounts,
    transfers,
    totalInUSD,
  } = useWormholeTransactions();

  const columns = [
    {
      title: '',
      dataIndex: 'logo',
      key: 'logo',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <Link to={`/move?from=${toChainSymbol(record.chain)}&token=${record.symbol}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {record.logo && <TokenDisplay logo={record.logo} chain={record.chain} />}
              </span>
            </Link>
          ),
        }
      }
    },
    {
      title: 'Asset',
      dataIndex: 'symbol',
      key: 'symbol',
      render(text: string, record: any) {
        return {
          props: { style: {} },
          children: (
            <Link to={`/move?from=${toChainSymbol(record.chain)}&token=${record.symbol}`}>
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
    },
    {
      title: 'TX hash',
      dataIndex: 'txhash',
      key: 'txhash',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ]

  return (
    <>
      <div className="flexColumn" style={{ minHeight: '93vh' }}>
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
          dataSource={transfers.filter(a => a.symbol)}
          columns={columns}
          loading={loadingLockedAccounts}
        />
      </div>
    </>
  );
};
