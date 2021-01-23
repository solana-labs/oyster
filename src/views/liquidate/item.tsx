import React, { useMemo } from "react";
import { cache, ParsedAccount, useMint } from "../../contexts/accounts";
import {
  LendingReserve,
  calculateBorrowAPY,
  collateralToLiquidity,
} from "../../models/lending";
import { EnrichedLendingObligation, useTokenName } from "../../hooks";
import { Link } from "react-router-dom";
import { Button } from "antd";
import { TokenIcon } from "../../components/TokenIcon";
import {
  wadToLamports,
  formatNumber,
  fromLamports,
  formatPct,
} from "../../utils/utils";
import { LABELS } from "../../constants";

export const LiquidateItem = (props: { item: EnrichedLendingObligation }) => {
  let obligation = props.item.info;

  const borrowReserve = cache.get(obligation.borrowReserve) as ParsedAccount<
    LendingReserve
  >;

  const collateralReserve = cache.get(
    obligation.collateralReserve
  ) as ParsedAccount<LendingReserve>;

  const liquidityMint = useMint(borrowReserve.info.liquidityMint);
  const collateralMint = useMint(collateralReserve.info.liquidityMint);

  const borrowAmount = fromLamports(
    wadToLamports(obligation.borrowAmountWad),
    liquidityMint
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);

  const collateralLamports = collateralToLiquidity(
    obligation.depositedCollateral,
    borrowReserve.info
  );
  const collateral = fromLamports(collateralLamports, collateralMint);

  const borrowName = useTokenName(borrowReserve?.info.liquidityMint);
  const collateralName = useTokenName(collateralReserve?.info.liquidityMint);

  return (
    <Link to={`/liquidate/${props.item.account.pubkey.toBase58()}`}>
      <div className="liquidate-item">
        <span style={{ display: "flex" }}>
          <div style={{ display: "flex" }}>
            <TokenIcon
              mintAddress={collateralReserve?.info.liquidityMint}
              style={{ marginRight: "-0.5rem" }}
            />
            <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
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
