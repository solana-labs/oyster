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
import { EnrichedLendingObligation } from '../../../hooks';
import {
  calculateBorrowAPY,
  collateralToLiquidity,
  healthFactorToRiskColor,
  Reserve,
} from '../../../models';

const { cache, useMint } = contexts.Accounts;

export const ObligationItem = (props: {
  obligation: EnrichedLendingObligation;
}) => {
  const { obligation } = props;

  const borrowReserve = cache.get(
    obligation.info.borrows[0].borrowReserve,
  ) as ParsedAccount<Reserve>;

  const depositReserve = cache.get(
    obligation.info.deposits[0].depositReserve,
  ) as ParsedAccount<Reserve>;

  const liquidityMint = useMint(borrowReserve.info.liquidity.mint);
  const collateralMint = useMint(depositReserve.info.liquidity.mint);

  const borrowAmount = fromLamports(
    wadToLamports(obligation.info.borrows[0].borrowedAmountWads),
    liquidityMint,
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);

  const collateralLamports = collateralToLiquidity(
    obligation.info.deposits[0].depositedAmount,
    borrowReserve.info,
  );
  const collateral = fromLamports(collateralLamports, collateralMint);

  const borrowName = useTokenName(borrowReserve?.info.liquidity.mint);
  const collateralName = useTokenName(depositReserve?.info.liquidity.mint);

  return (
    <div className="dashboard-item">
      <span style={{ display: 'flex', marginLeft: 5 }}>
        <div
          style={{ display: 'flex' }}
          title={`${collateralName}→${borrowName}`}
        >
          <TokenIcon
            mintAddress={depositReserve?.info.liquidity.mint}
            style={{ marginRight: '-0.5rem' }}
          />
          <TokenIcon mintAddress={borrowReserve?.info.liquidity.mint} />
        </div>
      </span>
      <div>
        <div>
          <div>
            <em>{formatNumber.format(borrowAmount)}</em> {borrowName}
          </div>
          <div className="dashboard-amount-quote">
            ${formatNumber.format(obligation.info.borrowedInQuote)}
          </div>
        </div>
      </div>
      <div>
        <div>
          <div>
            <em>{formatNumber.format(collateral)}</em> {collateralName}
          </div>
          <div className="dashboard-amount-quote">
            ${formatNumber.format(obligation.info.collateralInQuote)}
          </div>
        </div>
      </div>
      <div>{formatPct.format(borrowAPY)}</div>
      <div style={{ color: healthFactorToRiskColor(obligation.info.health) }}>
        {formatPct.format(obligation.info.ltv / 100)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link to={`/borrow/${borrowReserve.pubkey.toBase58()}`}>
          <Button type="primary">
            <span>Borrow</span>
          </Button>
        </Link>
        <Link to={`/repay/loan/${obligation.account.pubkey.toBase58()}`}>
          <Button type="text">
            <span>Repay</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
