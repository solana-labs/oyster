import { Card, Col, Row, Statistic } from "antd";
import {
  formatNumber,
  formatPct,
  fromLamports,
  wadToLamports,
} from "../../utils/utils";
import React, { useMemo } from "react";
import {
  EnrichedLendingObligation,
  useLendingReserve,
  useTokenName,
} from "../../hooks";
import { useMint } from "../../contexts/accounts";
import { calculateBorrowAPY, collateralToLiquidity } from "../../models";
import { GUTTER } from "../../constants";

export const LoanInfoLine = (props: {
  className?: string;
  obligation: EnrichedLendingObligation;
}) => {
  const obligation = props.obligation;

  const repayReserve = useLendingReserve(obligation?.info.borrowReserve);
  const withdrawReserve = useLendingReserve(obligation?.info.collateralReserve);

  const liquidityMint = useMint(repayReserve?.info.liquidityMint);
  const collateralMint = useMint(withdrawReserve?.info.liquidityMint);
  const repayName = useTokenName(repayReserve?.info.liquidityMint);
  const withdrawName = useTokenName(withdrawReserve?.info.liquidityMint);

  const borrowAPY = useMemo(
    () => (repayReserve ? calculateBorrowAPY(repayReserve?.info) : 0),
    [repayReserve]
  );
  if (!obligation || !repayReserve) {
    return null;
  }
  const borrowAmount = fromLamports(
    wadToLamports(obligation?.info.borrowAmountWad),
    liquidityMint
  );
  const collateralLamports = collateralToLiquidity(
    obligation?.info.depositedCollateral,
    repayReserve.info
  );
  const collateral = fromLamports(collateralLamports, collateralMint);

  return (
    <Row gutter={GUTTER}>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic
            title="Loan Balance"
            value={obligation.info.borrowedInQuote}
            formatter={(val) => (
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
            formatter={(val) => (
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
