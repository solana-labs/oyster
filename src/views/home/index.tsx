import { MintInfo } from "@solana/spl-token";
import { Card, Col, Row, Statistic } from "antd";
import React, { useEffect, useState } from "react";
import { LABELS } from "../../constants";
import { cache, ParsedAccount } from "../../contexts/accounts";
import { useMarkets } from "../../contexts/market";
import { useLendingReserves } from "../../hooks";
import { reserveMarketCap } from "../../models";
import { fromLamports, wadToLamports } from "../../utils/utils";
import { LendingReserveItem } from "./item";
import "./itemStyle.less";

export const HomeView = () => {
  const { reserveAccounts } = useLendingReserves();
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const { marketEmitter, midPriceInUSD } = useMarkets();

  useEffect(() => {
    const refreshTotal = () => {
      let totalSize = 0;
      let borrowed = 0;

      reserveAccounts.forEach((item) => {
        const marketCapLamports = reserveMarketCap(item.info);

        
        const localCache = cache;
        const liquidityMint = localCache.get(
          item.info.liquidityMint.toBase58()
        ) as ParsedAccount<MintInfo>;

        if (!liquidityMint) {
          return;
        }

        const marketCap =
          fromLamports(marketCapLamports, liquidityMint?.info) *
          midPriceInUSD(liquidityMint?.pubkey.toBase58());

        totalSize = totalSize + marketCap;

        borrowed = borrowed + fromLamports(
          wadToLamports(item.info?.borrowedLiquidityWad).toNumber(),
          liquidityMint.info);
      });

      setTotalMarketSize(totalSize);
      setTotalBorrowed(borrowed);
    };

    const dispose = marketEmitter.onMarket(() => {
      refreshTotal();
    });

    refreshTotal();

    return () => {
      dispose();
    };
  }, [marketEmitter, midPriceInUSD, setTotalMarketSize, reserveAccounts]);

  return (
    <div className="flexColumn">
      <Row gutter={16} className="home-info-row">
        <Col span={12}>
          <Card >
            <Statistic
              title="Current market size"
              value={totalMarketSize}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card >
            <Statistic
              title="Total borrowed"
              value={totalBorrowed}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>


      <div className="home-item home-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_MARKET_SIZE}</div>
        <div>{LABELS.TABLE_TITLE_TOTAL_BORROWED}</div>
        <div>{LABELS.TABLE_TITLE_DEPOSIT_APY}</div>
        <div>{LABELS.TABLE_TITLE_BORROW_APY}</div>
      </div>
      {reserveAccounts.map((account) => (
        <LendingReserveItem reserve={account.info} address={account.pubkey} />
      ))}
    </div>
  );
};
