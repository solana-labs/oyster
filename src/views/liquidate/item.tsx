import React, { useMemo }  from "react";
import { cache, ParsedAccount, useMint } from "../../contexts/accounts";
import { LendingObligation, LendingReserve, calculateBorrowAPY } from "../../models/lending";
import { useTokenName } from "../../hooks";
import { Link } from "react-router-dom";
import { Button, Card } from "antd";
import { TokenIcon } from "../../components/TokenIcon";
import {
  wadToLamports,
  formatNumber,
  fromLamports,
  formatPct,
} from "../../utils/utils";
import { LABELS } from "../../constants";

export const LiquidateItem = (props: {
  obligation: ParsedAccount<LendingObligation>;
}) => {

  const { obligation } = props;

  const borrowReserve = cache.get(obligation.info.borrowReserve) as ParsedAccount<LendingReserve>;
  const tokenName = useTokenName(borrowReserve?.info.liquidityMint);
  const liquidityMint = useMint(borrowReserve.info.liquidityMint);

  console.log("wad",obligation.info.borrowAmountWad)

  const borrowAmount = fromLamports(
    wadToLamports(obligation.info.borrowAmountWad),
    liquidityMint
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(borrowReserve.info), [
    borrowReserve,
  ]);

  return (
    <Link to={`/liquidate/${obligation.pubkey.toBase58()}`}>
      <Card>
        <div className="liquidate-item">
          <span style={{ display: "flex" }}>
            <TokenIcon mintAddress={borrowReserve.info.liquidityMint} />
            {tokenName}
          </span>
          <div>
            {formatNumber.format(borrowAmount)} {tokenName}
          </div>
          <div>
            {formatPct.format(borrowAPY)}
          </div>
          <div>
            <Button>
              <span>{LABELS.LIQUIDATE_ACTION}</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};