import { MintInfo } from '@solana/spl-token';
import { Table, Tag, Space, Card, Col, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { GUTTER, LABELS } from '../../constants';
import { contexts, ParsedAccount, utils } from '@oyster/common';
import { useMarkets } from '../../contexts/market';

import { LendingReserveItem } from './item';
import { AppBar } from './../../components/AppBar';
import './itemStyle.less';
import { Totals } from '../../models/totals';
const { fromLamports, getTokenName, wadToLamports } = utils;
const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

export const HomeView = () => {
  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const [totals, setTotals] = useState<Totals>({
    marketSize: 0,
    numberOfAssets: 0,
    items: [],
  });

  useEffect(() => {
    const refreshTotal = () => {
      let newTotals: Totals = {
        marketSize: 0,
        numberOfAssets: 0,
        items: [],
      };

      [].forEach(item => {
        const address = ''; // item.pubkey.toBase58()

        const localCache = cache;
        const liquidityMint = localCache.get(
          address,
        ) as ParsedAccount<MintInfo>;

        if (!liquidityMint) {
          return;
        }

        const price = midPriceInUSD(liquidityMint?.pubkey.toBase58());
        const marketCapLamports = 0;
        const marketSize =
          fromLamports(marketCapLamports, liquidityMint?.info) * price;
        let leaf = {
          key: address,
          marketSize,
          nativeSize: 0,
          name: getTokenName(tokenMap, address),
        };

        newTotals.items.push(leaf);

        newTotals.marketSize = newTotals.marketSize + leaf.marketSize;
      });

      newTotals.items = newTotals.items.sort(
        (a, b) => b.marketSize - a.marketSize,
      );

      setTotals(newTotals);
    };

    const dispose = marketEmitter.onMarket(() => {
      refreshTotal();
    });

    refreshTotal();

    return () => {
      dispose();
    };
  }, [marketEmitter, midPriceInUSD, setTotals, tokenMap]);

  const dataSource = [
    {
      key: '1',
      name: 'Mike',
      age: 32,
      address: '10 Downing Street',
    },
    {
      key: '2',
      name: 'John',
      age: 42,
      address: '10 Downing Street',
    },
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
  ];

  return (
    <div className="flexColumn">
      <Row
        gutter={GUTTER}
        justify="center"
        align="middle"
        className="home-info-row wormhole-bg"
      >
        <Col xs={24} xl={8}>
          <h1>Wormhole</h1>
          <h2>Ethereum and Solana Bridge</h2>
          <AppBar />
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title="Current market size"
              value={totals.marketSize}
              precision={2}
              valueStyle={{ color: '#3fBB00' }}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title="Assets"
              value={totals.numberOfAssets}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>
      <Table dataSource={dataSource} columns={columns} />
    </div>
  );
};
