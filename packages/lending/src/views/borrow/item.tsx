import {
  formatNumber,
  formatPct,
  TokenIcon,
  useTokenName,
} from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { Button } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants';
import { usePrice } from '../../contexts/pyth';
import { useBorrowingPower } from '../../hooks';
import { calculateBorrowAPY, Reserve } from '../../models';

export const BorrowItem = (props: { reserve: Reserve; address: PublicKey }) => {
  const name = useTokenName(props.reserve.liquidity.mintPubkey);
  const price = usePrice(props.reserve.liquidity.mintPubkey.toBase58());

  const { borrowingPower, totalInQuote } = useBorrowingPower(props.address);

  const apr = calculateBorrowAPY(props.reserve);

  return (
    <Link to={`/borrow/${props.address.toBase58()}`}>
      <div className="borrow-item">
        <span style={{ display: 'flex' }}>
          <TokenIcon mintAddress={props.reserve.liquidity.mintPubkey} />
          {name}
        </span>
        <div>${formatNumber.format(price)}</div>
        <div>
          <div>
            <div>
              <em>{formatNumber.format(borrowingPower)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(totalInQuote)}
            </div>
          </div>
        </div>
        <div>{formatPct.format(apr)}</div>
        <div>
          <Button type="primary">
            <span>{LABELS.BORROW_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
