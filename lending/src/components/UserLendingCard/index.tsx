import React from 'react';
import {
  useUserCollateralBalance,
  useUserBalance,
  useBorrowedAmount,
  useBorrowingPower,
  useUserObligationByReserve,
} from './../../hooks';
import { useTokenName } from '@packages/common/hooks';
import { LendingReserve } from '../../models/lending';
import { formatNumber } from '@packages/common/utils/utils';
import { Button, Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import { LABELS } from '../../constants';

const { Text } = Typography;

export const UserLendingCard = (props: { className?: string; reserve: LendingReserve; address: PublicKey }) => {
  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);

  const { balance: tokenBalance, balanceInUSD: tokenBalanceInUSD } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance, balanceInUSD: collateralBalanceInUSD } = useUserCollateralBalance(props.reserve);

  const { borrowed: totalBorrowed, borrowedInUSD, ltv, health } = useBorrowedAmount(address);
  const { totalInQuote: borrowingPowerInUSD, borrowingPower } = useBorrowingPower(address);
  const { userObligationsByReserve } = useUserObligationByReserve(address);

  return (
    <Card
      className={props.className}
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.2rem',
            justifyContent: 'center',
          }}
        >
          Your Information
        </div>
      }
    >
      <h3>{LABELS.BORROWS}</h3>

      <div className='card-row'>
        <Text type='secondary' className='card-cell '>
          Borrowed
        </Text>
        <div className='card-cell '>
          <div>
            <div>
              <em>{formatNumber.format(totalBorrowed)}</em> {name}
            </div>
            <div className='dashboard-amount-quote'>${formatNumber.format(borrowedInUSD)}</div>
          </div>
        </div>
      </div>

      <div className='card-row'>
        <Text type='secondary' className='card-cell '>
          {LABELS.TABLE_TITLE_HEALTH}:
        </Text>
        <div className='card-cell '>{health.toFixed(2)}</div>
      </div>

      <div className='card-row'>
        <Text type='secondary' className='card-cell '>
          {LABELS.LOAN_TO_VALUE}:
        </Text>
        <div className='card-cell '>{formatNumber.format(ltv)}</div>
      </div>

      <div className='card-row'>
        <Text type='secondary' className='card-cell '>
          Available to you:
        </Text>
        <div className='card-cell '>
          <div>
            <div>
              <em>{formatNumber.format(borrowingPower)}</em> {name}
            </div>
            <div className='dashboard-amount-quote'>${formatNumber.format(borrowingPowerInUSD)}</div>
          </div>
        </div>
      </div>

      <h3>{LABELS.DEPOSITS}</h3>

      <div className='card-row'>
        <Text type='secondary' className='card-cell '>
          {LABELS.WALLET_BALANCE}:
        </Text>
        <div className='card-cell '>
          <div>
            <div>
              <em>{formatNumber.format(tokenBalance)}</em> {name}
            </div>
            <div className='dashboard-amount-quote'>${formatNumber.format(tokenBalanceInUSD)}</div>
          </div>
        </div>
      </div>

      <div className='card-row'>
        <Text type='secondary' className='card-cell '>
          You already deposited:
        </Text>
        <div className='card-cell '>
          <div>
            <div>
              <em>{formatNumber.format(collateralBalance)}</em> {name}
            </div>
            <div className='dashboard-amount-quote'>${formatNumber.format(collateralBalanceInUSD)}</div>
          </div>
        </div>
      </div>

      <div className='card-row' style={{ marginTop: 20, justifyContent: 'space-evenly' }}>
        <Link to={`/deposit/${address}`}>
          <Button>{LABELS.DEPOSIT_ACTION}</Button>
        </Link>
        <Link to={`/borrow/${address}`}>
          <Button>{LABELS.BORROW_ACTION}</Button>
        </Link>
        <Link to={`/withdraw/${address}`}>
          <Button>{LABELS.WITHDRAW_ACTION}</Button>
        </Link>
        {!!userObligationsByReserve.length && (
          <Link to={`/repay/loan/${userObligationsByReserve[0].obligation.account.pubkey.toBase58()}`}>
            <Button>{LABELS.REPAY_ACTION}</Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
