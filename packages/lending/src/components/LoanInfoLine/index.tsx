import {
  contexts,
  formatNumber,
  formatPct,
  fromLamports,
  useTokenName,
  wadToLamports,
} from '@oyster/common';
import { Card, Col, Row, Statistic } from 'antd';
import React, { useMemo } from 'react';
import { GUTTER } from '../../constants';
import { EnrichedLendingObligation, useLendingReserve } from '../../hooks';
import { calculateBorrowAPY, collateralToLiquidity } from '../../models';

const { useMint } = contexts.Accounts;
export const LoanInfoLine = (props: {
  className?: string;
  obligation: EnrichedLendingObligation;
}) => {
  const obligation = props.obligation;

  const repayReserve = useLendingReserve(obligation?.info.borrows[0].borrowReserve);
  const withdrawReserve = useLendingReserve(obligation?.info.deposits[0].depositReserve);

  const liquidityMint = useMint(repayReserve?.info.liquidity.mint);
  const collateralMint = useMint(withdrawReserve?.info.liquidity.mint);
  const repayName = useTokenName(repayReserve?.info.liquidity.mint);
  const withdrawName = useTokenName(withdrawReserve?.info.liquidity.mint);

  const borrowAPY = useMemo(
    () => (repayReserve ? calculateBorrowAPY(repayReserve?.info) : 0),
    [repayReserve],
  );
  if (!obligation || !repayReserve) {
    return null;
  }
  const borrowAmount = fromLamports(
    wadToLamports(obligation?.info.borrows[0].borrowedAmountWads),
    liquidityMint,
  );
  const collateralLamports = collateralToLiquidity(
    obligation?.info.deposits[0].depositedAmount,
    repayReserve.info,
  );
  const collateral = fromLamports(collateralLamports, collateralMint);

  return (
    <Row gutter={GUTTER}>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic
            title="Loan Balance"
            value={obligation.info.borrowedInQuote}
            formatter={val => (
              <div>
                <div>
                  <em>{formatNumber.format(borrowAmount)}</em> {repayName}
                </div>
                <div className="dashboard-amount-quote">
                  ${formatNumber.format(parseFloat(val.toString()))}
                </div>
              </div>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic
            title="Collateral"
            value={obligation.info.collateralInQuote}
            formatter={val => (
              <div>
                <div>
                  <em>{formatNumber.format(collateral)}</em> {withdrawName}
                </div>
                <div className="dashboard-amount-quote">
                  ${formatNumber.format(parseFloat(val.toString()))}
                </div>
              </div>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic title="APY" value={formatPct.format(borrowAPY)} />
        </Card>
      </Col>
      <Col xs={24} xl={9}>
        <Card className={props.className}>
          <Statistic
            title="Health Factor"
            value={obligation.info.health.toFixed(2)}
          />
        </Card>
      </Col>
    </Row>
  );
};
