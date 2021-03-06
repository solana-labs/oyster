
import { Table, Col, Row, Statistic, Button } from 'antd';
import React from 'react';
import { GUTTER, LABELS } from '../../constants';
import { formatNumber} from '@oyster/common';
import './itemStyle.less';
import { Link } from 'react-router-dom';
import {useWormholeAccounts} from "../../hooks/useWormholeAccounts";

export const HomeView = () => {
  const {
    loading: loadingLockedAccounts,
    externalAssets,
    totalInUSD
  } = useWormholeAccounts();


  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
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
      title: 'Amount In USD',
      dataIndex: 'amountInUSD',
      key: 'amountInUSD',
    },
    {
      title: 'Asset Address',
      dataIndex: 'address',
      key: 'address',
    }
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
          <h2><span>Ethereum + Solana Bridge</span></h2>
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
      <Table dataSource={externalAssets} columns={columns} loading={loadingLockedAccounts} />
    </div>
  );
};
