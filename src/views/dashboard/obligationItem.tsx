import React, { useMemo } from "react";
import { useTokenName } from "../../hooks";
import { calculateBorrowAPY, LendingObligation, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { wadToLamports, formatNumber, fromLamports, formatPct } from "../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { cache, ParsedAccount, useMint } from "../../contexts/accounts";

export const ObligationItem = (props: {
  obligation: ParsedAccount<LendingObligation>;
}) => {
  const { obligation } = props;

  const borrowReserve = cache.get(
    obligation.info.borrowReserve
  ) as ParsedAccount<LendingReserve>;

  const name = useTokenName(borrowReserve?.info.liquidityMint);

  const liquidityMint = useMint(borrowReserve.info.liquidityMint);

  const borrowAmount = fromLamports(
    wadToLamports(obligation.info.borrowAmountWad),
    liquidityMint
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);

  return (
    <Card>
      <div className="dashboard-item">
        <span style={{ display: "flex" }}>
          <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
          {name}
        </span>
        <div>
          {formatNumber.format(borrowAmount)} {name}
        </div>
        <div>{formatPct.format(borrowAPY)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link to={`/borrow/${borrowReserve.pubkey.toBase58()}`}>
            <Button>
              <span>Borrow</span>
            </Button>
          </Link>
          <Link to={`/repay/loan/${obligation.pubkey.toBase58()}`}>
            <Button>
              <span>Repay</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
