import { MintInfo } from '@solana/spl-token';
import { Card, Col, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { GUTTER, LABELS } from '../../constants';
import { contexts, ParsedAccount, utils } from '@oyster/common';
import { useMarkets } from '../../contexts/market';

import { LendingReserveItem } from './item';
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
        const marketSize = fromLamports(marketCapLamports, liquidityMint?.info) * price;
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

  return (
    <div className="flexColumn">
      <Row gutter={GUTTER} className="home-info-row">
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
        <Col xs={24} xl={5}>
          <Card>

          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card>

          </Card>
        </Col>
      </Row>

      <Card>

      </Card>
    </div>
  );
};
