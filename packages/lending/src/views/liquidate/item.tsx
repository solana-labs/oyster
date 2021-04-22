import {
  contexts,
  formatNumber,
  formatPct,
  fromLamports,
  ParsedAccount,
  TokenIcon,
  useTokenName,
  wadToLamports,
} from '@oyster/common';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LABELS } from '../../constants';
import { EnrichedLendingObligation } from '../../hooks';
import {
  calculateBorrowAPY,
  collateralToLiquidity,
  Reserve,
} from '../../models';

const { useMint, cache } = contexts.Accounts;

export const LiquidateItem = (props: { item: EnrichedLendingObligation }) => {
  let obligation = props.item.info;

  const borrowReserve = cache.get(
    obligation.borrows[0].borrowReserve,
  ) as ParsedAccount<Reserve>;

  const depositReserve = cache.get(
    obligation.deposits[0].depositReserve,
  ) as ParsedAccount<Reserve>;

  const liquidityMint = useMint(borrowReserve.info.liquidity.mint);
  const collateralMint = useMint(depositReserve.info.liquidity.mint);

  const borrowAmount = fromLamports(
    wadToLamports(obligation.borrows[0].borrowedAmountWads),
    liquidityMint,
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);

  const collateralLamports = collateralToLiquidity(
    obligation.deposits[0].depositedAmount,
    borrowReserve.info,
  );
  const collateral = fromLamports(collateralLamports, collateralMint);

  const borrowName = useTokenName(borrowReserve?.info.liquidity.mint);
  const collateralName = useTokenName(depositReserve?.info.liquidity.mint);

  return (
    <Link to={`/liquidate/${props.item.account.pubkey.toBase58()}`}>
      <div className="liquidate-item">
        <span style={{ display: 'flex' }}>
          <div style={{ display: 'flex' }}>
            <TokenIcon
              mintAddress={depositReserve?.info.liquidity.mint}
              style={{ marginRight: '-0.5rem' }}
            />
            <TokenIcon mintAddress={borrowReserve?.info.liquidity.mint} />
          </div>
          {collateralName}→{borrowName}
        </span>
        <div>
          <div>
            <div>
              <em>{formatNumber.format(borrowAmount)}</em> {borrowName}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(obligation.borrowedInQuote)}
            </div>
          </div>
        </div>
        <div>
          <div>
            <div>
              <em>{formatNumber.format(collateral)}</em> {collateralName}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(obligation.collateralInQuote)}
            </div>
          </div>
        </div>
        <div>{formatPct.format(borrowAPY)}</div>
        <div>{formatPct.format(obligation.ltv / 100)}</div>
        <div>{obligation.health.toFixed(2)}</div>
        <div>
          <Button type="primary">
            <span>{LABELS.LIQUIDATE_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
