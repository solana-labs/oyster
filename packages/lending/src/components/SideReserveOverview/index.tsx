import React from 'react';
import { calculateBorrowAPY, calculateDepositAPY, calculateUtilizationRatio, LendingReserve } from '../../models';

import { Card, Typography } from 'antd';
import { contexts, hooks, ParsedAccount, TokenIcon, utils } from '@oyster/common';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants';

const { formatNumber, formatPct, fromLamports } = utils;
const { useMint } = contexts.Accounts;
const { useTokenName } = hooks;

const { Text } = Typography;

export enum SideReserveOverviewMode {
  Deposit = 'deposit',
  Borrow = 'borrow',
}

export const SideReserveOverview = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
  mode: SideReserveOverviewMode;
}) => {
  const reserve = props.reserve.info;
  const mode = props.mode;
  const name = useTokenName(reserve?.liquidityMint);
  const liquidityMint = useMint(reserve.liquidityMint);

  const availableLiquidity = fromLamports(
    reserve.state.availableLiquidity,
    liquidityMint
  );

  const depositApy = calculateDepositAPY(reserve);
  const borrowApr = calculateBorrowAPY(reserve);

  const utilizationRate = calculateUtilizationRatio(reserve);
  const liquidationThreshold = reserve.config.liquidationThreshold / 100;
  const liquidationPenalty = reserve.config.liquidationBonus / 100;
  const maxLTV = reserve.config.loanToValueRatio / 100;

  let extraInfo: JSX.Element | null = null;
  if (mode === SideReserveOverviewMode.Deposit) {
    extraInfo = (
      <>
        <div className='card-row'>
          <Text type='secondary' className='card-cell'>
            {LABELS.TABLE_TITLE_DEPOSIT_APY}:
          </Text>
          <div className='card-cell'>{formatPct.format(depositApy)}</div>
        </div>

        <div className='card-row'>
          <Text type='secondary' className='card-cell'>
            Maximum LTV:
          </Text>
          <div className='card-cell'>{formatPct.format(maxLTV)}</div>
        </div>

        <div className='card-row'>
          <Text type='secondary' className='card-cell'>
            Liquidation threshold:
          </Text>
          <div className='card-cell'>
            {formatPct.format(liquidationThreshold)}
          </div>
        </div>

        <div className='card-row'>
          <Text type='secondary' className='card-cell '>
            Liquidation penalty:
          </Text>
          <div className='card-cell'>
            {formatPct.format(liquidationPenalty)}
          </div>
        </div>
      </>
    );
  } else if (mode === SideReserveOverviewMode.Borrow) {
    extraInfo = (
      <>
        <div className='card-row'>
          <Text type='secondary' className='card-cell'>
            {LABELS.TABLE_TITLE_BORROW_APY}:
          </Text>
          <div className='card-cell'>{formatPct.format(borrowApr)}</div>
        </div>
      </>
    );
  }

  return (
    <Card
      className={props.className}
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.2rem',
            justifyContent: 'center'
          }}>
          <Link to={`/reserve/${props.reserve.pubkey}`}>
            <TokenIcon
              mintAddress={reserve?.liquidityMint}
              style={{ width: 30, height: 30 }}
            />{' '}
            {name} Reserve Overview
          </Link>
        </div>
      }
    >
      <div className='card-row'>
        <Text type='secondary' className='card-cell'>
          Utilization rate:
        </Text>
        <div className='card-cell'>{formatPct.format(utilizationRate)}</div>
      </div>

      <div className='card-row'>
        <Text type='secondary' className='card-cell'>
          Available liquidity:
        </Text>
        <div className='card-cell'>
          {formatNumber.format(availableLiquidity)} {name}
        </div>
      </div>

      {extraInfo}
    </Card>
  );
};
