import React from 'react';
import { useTokenName } from 'common/src/hooks';
import { useBorrowingPower } from '../../hooks';
import { calculateBorrowAPY, LendingReserve } from '../../models/lending';
import { TokenIcon } from '../../components/TokenIcon';
import { formatNumber, formatPct } from 'common/src/utils/utils';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { useMidPriceInUSD } from '../../contexts/market';

export const BorrowItem = (props: { reserve: LendingReserve; address: PublicKey }) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const price = useMidPriceInUSD(props.reserve.liquidityMint.toBase58()).price;

  const { borrowingPower, totalInQuote } = useBorrowingPower(props.address);

  const apr = calculateBorrowAPY(props.reserve);

  return (
    <Link to={`/borrow/${props.address.toBase58()}`}>
      <div className='borrow-item'>
        <span style={{ display: 'flex' }}>
          <TokenIcon mintAddress={props.reserve.liquidityMint} />
          {name}
        </span>
        <div>${formatNumber.format(price)}</div>
        <div>
          <div>
            <div>
              <em>{formatNumber.format(borrowingPower)}</em> {name}
            </div>
            <div className='dashboard-amount-quote'>${formatNumber.format(totalInQuote)}</div>
          </div>
        </div>
        <div>{formatPct.format(apr)}</div>
        <div>
          <Button type='primary'>
            <span>{LABELS.BORROW_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
