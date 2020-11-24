import React from "react";
import { useTokenName } from "../../hooks";
import { LendingObligation, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import {
  decimalToLamports,
  formatNumber,
  fromLamports,
} from "../../utils/utils";
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
    decimalToLamports(obligation.info.borrowAmount),
    liquidityMint
  );

  return (
    <Link
      to={`/repay/${borrowReserve?.pubkey.toBase58()}/${obligation.pubkey.toBase58()}`}
    >
      <Card>
        <div className="borrow-item">
          <span style={{ display: "flex" }}>
            <TokenIcon mintAddress={borrowReserve?.info.liquidityMint} />
            {name}
          </span>
          <div>
            {formatNumber.format(borrowAmount)} {name}
          </div>
          <div>--</div>
          <div>
            <Button>
              <span>Repay</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};
