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
import { useMidPriceInUSD } from '../../contexts/market';
import { useBorrowingPower } from '../../hooks';
import { calculateBorrowAPY, Reserve } from '../../models';

export const MarginTradeItem = (props: {
  reserve: Reserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidity.mint);
  const price = useMidPriceInUSD(props.reserve.liquidity.mint.toBase58()).price;

  const apr = calculateBorrowAPY(props.reserve);

  // TODO: specifc max leverage
  const { totalInQuote, borrowingPower } = useBorrowingPower(
    props.address,
    false,
    false,
  );

  return (
    <Link to={`/margin/${props.address.toBase58()}`}>
      <div className="choose-margin-item">
        <span style={{ display: 'flex' }}>
          <TokenIcon mintAddress={props.reserve.liquidity.mint} />
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
            <span>{LABELS.MARGIN_TRADE_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
