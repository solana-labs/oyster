import {
  contexts,
  formatNumber,
  formatPct,
  fromLamports,
  TokenIcon,
  useTokenName,
  wadToLamports,
} from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  calculateBorrowAPY,
  calculateDepositAPY,
  Reserve,
  TotalItem,
} from '../../models';

const { useMint } = contexts.Accounts;

export const LendingReserveItem = (props: {
  reserve: Reserve;
  address: PublicKey;
  item?: TotalItem;
}) => {
  const name = useTokenName(props.reserve.liquidity.mint);

  const liquidityMint = useMint(props.reserve.liquidity.mint);

  const availableAmount = fromLamports(
    props.reserve.liquidity.availableAmount,
    liquidityMint,
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.liquidity.borrowedAmountWads),
        liquidityMint,
      ),
    [props.reserve, liquidityMint],
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(props.reserve), [
    props.reserve,
  ]);

  const depositAPY = useMemo(() => calculateDepositAPY(props.reserve), [
    props.reserve,
  ]);

  const marketSize = availableAmount + totalBorrows;

  return (
    <Link to={`/reserve/${props.address.toBase58()}`}>
      <div className="home-item">
        <span style={{ display: 'flex' }}>
          <TokenIcon mintAddress={props.reserve.liquidity.mint} />
          {name}
        </span>
        <div title={marketSize.toString()}>
          <div>
            <div>
              <em>{formatNumber.format(marketSize)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(props.item?.marketSize)}
            </div>
          </div>
        </div>
        <div title={totalBorrows.toString()}>
          <div>
            <div>
              <em>{formatNumber.format(totalBorrows)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(props.item?.borrowed)}
            </div>
          </div>
        </div>
        <div title={depositAPY.toString()}>{formatPct.format(depositAPY)}</div>
        <div title={borrowAPY.toString()}>{formatPct.format(borrowAPY)}</div>
      </div>
    </Link>
  );
};
