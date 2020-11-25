import React, { useMemo } from "react";
import { useTokenName } from "../../hooks";
import { calculateBorrowAPY, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import {
  wadToLamports,
  formatNumber,
  fromLamports,
  formatPct,
} from "../../utils/utils";
import { Card } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useMint } from "../../contexts/accounts";

export const LendingReserveItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);

  const liquidityMint = useMint(props.reserve.liquidityMint);

  const totalLiquidity = fromLamports(
    props.reserve.totalLiquidity.toNumber(),
    liquidityMint
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(wadToLamports(props.reserve.totalBorrowsWad), liquidityMint),
    [props.reserve, liquidityMint]
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(props.reserve), [
    props.reserve,
  ]);

  return (
    <Link to={`/reserve/${props.address.toBase58()}`}>
      <Card>
        <div className="home-item">
          <span style={{ display: "flex" }}>
            <TokenIcon mintAddress={props.reserve.liquidityMint} />
            {name}
          </span>
          <div>
            {formatNumber.format(totalLiquidity+totalBorrows)} {name}
          </div>
          <div>
            {formatNumber.format(totalBorrows)} {name}
          </div>
          <div>--</div>
          <div>{formatPct.format(borrowAPY)}</div>
        </div>
      </Card>
    </Link>
  );
};
