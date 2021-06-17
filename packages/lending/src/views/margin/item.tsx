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

export const MarginTradeItem = (props: {
  reserve: Reserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidity.mintPubkey);
  const price = usePrice(props.reserve.liquidity.mintPubkey.toBase58());

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
            <span>{LABELS.MARGIN_TRADE_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
