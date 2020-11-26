import React from "react";
import { useTokenName } from "../../hooks";
import { LendingObligation, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { wadToLamports, formatNumber, fromLamports } from "../../utils/utils";
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
        <div>--</div>
        <div style={{ display: "flex", justifyContent: 'flex-end' }}>
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
