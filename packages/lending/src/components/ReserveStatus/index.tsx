import {
  contexts,
  formatNumber,
  fromLamports,
  TokenIcon,
  wadToLamports,
} from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { Card, Col, Row, Statistic } from 'antd';
import React, { useMemo } from 'react';
import { GUTTER, LABELS } from '../../constants';
import { useMidPriceInUSD } from '../../contexts/market';
import { calculateDepositAPY, Reserve } from '../../models';
import { ReserveUtilizationChart } from './../../components/ReserveUtilizationChart';
import './style.less';

const { useMint } = contexts.Accounts;
export const ReserveStatus = (props: {
  className?: string;
  reserve: Reserve;
  address: PublicKey;
}) => {
  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const mintAddress = props.reserve.liquidity.mint?.toBase58();
  const liquidityMint = useMint(mintAddress);
  const { price } = useMidPriceInUSD(mintAddress);
  const availableAmount = fromLamports(
    props.reserve.liquidity.availableAmount,
    liquidityMint,
  );

  const availableAmountInUSD = price * availableAmount;

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.liquidity.borrowedAmountWads),
        liquidityMint,
      ),
    [props.reserve, liquidityMint],
  );

  const totalBorrowsInUSD = price * totalBorrows;

  const depositAPY = useMemo(() => calculateDepositAPY(props.reserve), [
    props.reserve,
  ]);

  const liquidationThreshold = props.reserve.config.liquidationThreshold;
  const liquidationPenalty = props.reserve.config.liquidationBonus;
  const maxLTV = props.reserve.config.loanToValueRatio;

  return (
    <Card
      className={props.className}
      title={
        <>
          <TokenIcon
            style={{
              marginRight: 0,
              marginTop: 0,
              position: 'absolute',
              left: 15,
            }}
            mintAddress={mintAddress}
            size={30}
          />
          {LABELS.RESERVE_STATUS_TITLE}
        </>
      }
      bodyStyle={bodyStyle}
    >
      <div className="flexColumn">
        <Row gutter={GUTTER}>
          <Col span={12}>
            <Statistic
              title="Available Liquidity"
              value={availableAmount}
              valueRender={node => (
                <div>
                  {node}
                  <div className="dashboard-amount-quote-stat">
                    ${formatNumber.format(availableAmountInUSD)}
                  </div>
                </div>
              )}
              precision={2}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Total Borrowed"
              value={totalBorrows}
              valueRender={node => (
                <div>
                  {node}
                  <div className="dashboard-amount-quote-stat">
                    ${formatNumber.format(totalBorrowsInUSD)}
                  </div>
                </div>
              )}
              precision={2}
            />
          </Col>
        </Row>
        <Row gutter={GUTTER}>
          <Col
            span={24}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
            }}
          >
            <ReserveUtilizationChart reserve={props.reserve} />
          </Col>
        </Row>
        <Row gutter={GUTTER}>
          <Col span={6}>
            <Statistic
              title={LABELS.MAX_LTV}
              className="small-statisitc"
              value={maxLTV}
              precision={2}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={LABELS.LIQUIDATION_THRESHOLD}
              className="small-statisitc"
              value={liquidationThreshold}
              precision={2}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={LABELS.LIQUIDATION_PENALTY}
              className="small-statisitc"
              value={liquidationPenalty}
              precision={2}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={LABELS.TABLE_TITLE_DEPOSIT_APY}
              className="small-statisitc"
              value={depositAPY * 100}
              precision={2}
              suffix="%"
            />
          </Col>
        </Row>
      </div>
    </Card>
  );
};
