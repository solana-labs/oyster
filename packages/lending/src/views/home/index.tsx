import {
  contexts,
  fromLamports,
  getTokenName,
  ParsedAccount,
  wadToLamports,
} from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { Card, Col, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { GUTTER, LABELS } from '../../constants';
import { usePyth } from '../../contexts/pyth';
import { useReserves } from '../../hooks';
import { reserveMarketCap, Totals } from '../../models';
import { BarChartStatistic } from './../../components/BarChartStatistic';
import { LendingReserveItem } from './item';
import './itemStyle.less';

const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

export const HomeView = () => {
  const { reserveAccounts } = useReserves();
  const { getPrice } = usePyth();
  const { tokenMap } = useConnectionConfig();
  const [totals, setTotals] = useState<Totals>({
    marketSize: 0,
    borrowed: 0,
    lentOutPct: 0,
    items: [],
  });

  useEffect(() => {
    let newTotals: Totals = {
      marketSize: 0,
      borrowed: 0,
      lentOutPct: 0,
      items: [],
    };

    reserveAccounts.forEach(item => {
      const marketCapLamports = reserveMarketCap(item.info);

      const mint = item.info.liquidity.mintPubkey.toBase58();

      const liquidityMint = cache.get(mint) as
        | ParsedAccount<MintInfo>
        | undefined;
      if (!liquidityMint) {
        return;
      }

      const price = getPrice(mint);

      let leaf = {
        key: item.pubkey.toBase58(),
        marketSize: fromLamports(marketCapLamports, liquidityMint.info) * price,
        borrowed:
          fromLamports(
            wadToLamports(item.info.liquidity.borrowedAmountWads),
            liquidityMint.info,
          ) * price,
        name: getTokenName(tokenMap, mint),
      };

      newTotals.items.push(leaf);

      newTotals.marketSize = newTotals.marketSize + leaf.marketSize;
      newTotals.borrowed = newTotals.borrowed + leaf.borrowed;
    });

    newTotals.lentOutPct = newTotals.borrowed / newTotals.marketSize;
    newTotals.lentOutPct = Number.isFinite(newTotals.lentOutPct)
      ? newTotals.lentOutPct
      : 0;
    newTotals.items = newTotals.items.sort(
      (a, b) => b.marketSize - a.marketSize,
    );

    setTotals(newTotals);
  }, [getPrice, setTotals, reserveAccounts, tokenMap]);

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
              title="Total borrowed"
              value={totals.borrowed}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title="% Lent out"
              value={totals.lentOutPct * 100}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card>
            <BarChartStatistic
              title="Market composition"
              name={item => item.name}
              getPct={item => item.marketSize / totals.marketSize}
              items={totals.items}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="home-item home-header">
          <div>{LABELS.TABLE_TITLE_ASSET}</div>
          <div>{LABELS.TABLE_TITLE_MARKET_SIZE}</div>
          <div>{LABELS.TABLE_TITLE_TOTAL_BORROWED}</div>
          <div>{LABELS.TABLE_TITLE_DEPOSIT_APY}</div>
          <div>{LABELS.TABLE_TITLE_BORROW_APY}</div>
        </div>
        {reserveAccounts.map(account => (
          <LendingReserveItem
            key={account.pubkey.toBase58()}
            reserve={account.info}
            address={account.pubkey}
            item={totals.items.find(
              item => item.key === account.pubkey.toBase58(),
            )}
          />
        ))}
      </Card>
    </div>
  );
};
