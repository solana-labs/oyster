import { Card, Statistic } from "antd";
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
    <Card
      className={props.className}
      bodyStyle={{ display: "flex", justifyContent: "space-between" }}
    >
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
      <Statistic
        title="Collateral"
        value={obligation.info.borrowedInQuote}
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
      <Statistic title="APY" value={formatPct.format(borrowAPY)} />
      <Statistic
        title="Health Factor"
        value={obligation.info.health.toFixed(2)}
      />
    </Card>
  );
};
