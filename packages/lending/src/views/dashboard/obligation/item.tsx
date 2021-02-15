import React, { useMemo } from 'react';
import { EnrichedLendingObligation } from '../../../hooks';
import { hooks, utils, contexts, ParsedAccount, TokenIcon } from '@oyster/common';
import {
  calculateBorrowAPY,
  collateralToLiquidity,
  healthFactorToRiskColor,
  LendingReserve,
} from '../../../models/lending';

import { Button } from 'antd';
import { Link } from 'react-router-dom';
const { useTokenName } = hooks;

const { wadToLamports, formatNumber, fromLamports, formatPct } = utils;
const { cache, useMint } = contexts.Accounts;

export const ObligationItem = (props: {
  obligation: EnrichedLendingObligation;
}) => {
  const { obligation } = props;

  const borrowReserve = cache.get(
    obligation.info.borrowReserve,
  ) as ParsedAccount<LendingReserve>;

  const collateralReserve = cache.get(
    obligation.info.collateralReserve,
  ) as ParsedAccount<LendingReserve>;

  const liquidityMint = useMint(borrowReserve.info.liquidityMint);
  const collateralMint = useMint(collateralReserve.info.liquidityMint);

  const borrowAmount = fromLamports(
    wadToLamports(obligation.info.borrowAmountWad),
    liquidityMint,
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);

  const collateralLamports = collateralToLiquidity(
    obligation.info.depositedCollateral,
    borrowReserve.info,
  );
  const collateral = fromLamports(collateralLamports, collateralMint);

  const borrowName = useTokenName(borrowReserve?.info.liquidityMint);
  const collateralName = useTokenName(collateralReserve?.info.liquidityMint);

  return (
    <div className="dashboard-item">
      <span style={{ display: 'flex', marginLeft: 5 }}>
        <div
          style={{ display: 'flex' }}
          title={`${collateralName}→${borrowName}`}
        >
          <TokenIcon
            mintAddress={collateralReserve?.info.liquidityMint}
            style={{ marginRight: '-0.5rem' }}
          />
          <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
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
