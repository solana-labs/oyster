
import { Table, Col, Row, Statistic, Button } from 'antd';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { GUTTER, LABELS } from '../../constants';
import {ExplorerLink, formatNumber} from '@oyster/common';
import './itemStyle.less';
import { Link } from 'react-router-dom';
import {useLockedFundsAccounts} from "../../hooks/useLockedFundsAccounts";
import { EtherscanLink } from "@oyster/common";
import {ASSET_CHAIN} from "../../utils/assets";
import {COINGECKO_COIN_PRICE_API, COINGECKO_POOL_INTERVAL, useCoingecko} from "../../contexts/coingecko";

export const HomeView = () => {
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0)
  const [totalPerCoin, setTotalPerCoin] = useState<Map<string, {amount: number, amountInUSD: number}>>(new Map())
  const {
    loading: loadingLockedAccounts,
    lockedSolanaAccounts
  } = useLockedFundsAccounts();

  const coingeckoTimer = useRef<number>(0);
  const {coinList} = useCoingecko();

  const dataSourcePriceQuery = useCallback(async () => {
    const tempDataSources: any[] = [];
    const tempTotalPerCoin = new Map();
    for (const index in lockedSolanaAccounts) {
      const acc = lockedSolanaAccounts[index];

      const coinInfo = coinList.get(acc.symbol.toLowerCase());
      const parameters = `?ids=${coinInfo?.id}&vs_currencies=usd`;
      const resp = await window.fetch(COINGECKO_COIN_PRICE_API+parameters);
      const data = await resp.json();
      const price = coinInfo?.id ? data[coinInfo.id]?.usd || 1 : 1;
      const coinTotal = tempTotalPerCoin.get(acc.symbol);
      if (coinTotal) {
        tempTotalPerCoin.set(acc.symbol, {
          amount: acc.amount + coinTotal.amount,
          amountInUSD: (price * acc.amount) + coinTotal.amountInUSD
        })
      } else {
        tempTotalPerCoin.set(acc.symbol, {amount: acc.amount, amountInUSD: price * acc.amount})
      }

      tempDataSources.push({
        key: index.toString(),
        symbol: <div>{acc.assetIcon} {acc.symbol}</div>,
        name: acc.name,
        amount: acc.amount,
        price: price,
        amountInUSD: `$${price * acc.amount}`,
        assetAddress: acc.parsedAccount.assetChain === ASSET_CHAIN.Solana ?
          <ExplorerLink address={acc.parsedAssetAddress} type={"address"} length={5} /> :
          <EtherscanLink address={acc.parsedAssetAddress} type={"address"} length={5} />,
        sourceAddress: <ExplorerLink address={acc.sourceAddress} type={"address"} length={5} />,
        targetAddress: acc.parsedAccount.toChain === ASSET_CHAIN.Solana ?
          <ExplorerLink address={acc.targetAddress} type={"address"} length={5} /> :
          <EtherscanLink address={acc.targetAddress} type={"address"} length={5} />,
      });
    }
    setDataSource(tempDataSources);
    setTotalPerCoin(tempTotalPerCoin);
    setTotal(tempDataSources.reduce((acc, source) => acc + source.amount * source.price, 0));
    coingeckoTimer.current = window.setTimeout(
      () => dataSourcePriceQuery(),
      COINGECKO_POOL_INTERVAL
    );
  }, [lockedSolanaAccounts])
  useEffect(() => {
    if (!loadingLockedAccounts && coinList) {
      dataSourcePriceQuery();
    }
    return () => {
      window.clearTimeout(coingeckoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedSolanaAccounts]);

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
      dataIndex: 'assetAddress',
      key: 'assetAddress',
    },
    {
      title: 'Source Address',
      dataIndex: 'sourceAddress',
      key: 'sourceAddress',
    },
    {
      title: 'Target Address',
      dataIndex: 'targetAddress',
      key: 'targetAddress',
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
          <h2><span>Ethereum + Solana Bridge</span></h2>
          <Link to="/move">
            <Button className="app-action">Get Started</Button>
          </Link>
        </Col>
        <Col xs={24} xl={12}>
          <Statistic
            className="home-statistic"
            title={`$${formatNumber.format(total)}`}
            value="TOTAL VALUE LOCKED"
          />
          {Array.from(totalPerCoin, ([key, value]) => {
            return (
              <div style={{display: "inline-block", margin: "0 10px 0 10px"}}>
                <div>
                  <em>{value.amount}</em> {key}
                </div>
                <div className="dashboard-amount-quote">${formatNumber.format(value.amountInUSD)}</div>
              </div>
            );
          })}
        </Col>
      </Row>
      <Table dataSource={dataSource} columns={columns} loading={loadingLockedAccounts} />
    </div>
  );
};
