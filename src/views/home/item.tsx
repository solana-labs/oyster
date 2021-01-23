import React, { useMemo } from "react";
import { useTokenName } from "../../hooks";
import {
  calculateBorrowAPY,
  calculateDepositAPY,
  LendingReserve,
} from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import {
  wadToLamports,
  formatNumber,
  fromLamports,
  formatPct,
} from "../../utils/utils";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useMint } from "../../contexts/accounts";
import { TotalItem } from "../../models";

export const LendingReserveItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
  item?: TotalItem;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);

  const liquidityMint = useMint(props.reserve.liquidityMint);

  const availableLiquidity = fromLamports(
    props.reserve.state.availableLiquidity,
    liquidityMint
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.state.borrowedLiquidityWad),
        liquidityMint
      ),
    [props.reserve, liquidityMint]
  );

  const borrowAPY = useMemo(() => calculateBorrowAPY(props.reserve), [
    props.reserve,
  ]);

  const depositAPY = useMemo(() => calculateDepositAPY(props.reserve), [
    props.reserve,
  ]);

  const marketSize = availableLiquidity + totalBorrows;

  return (
    <Link to={`/reserve/${props.address.toBase58()}`}>
      <div className="home-item">
        <span style={{ display: "flex" }}>
          <TokenIcon mintAddress={props.reserve.liquidityMint} />
          {name}
        </span>
        <div title={marketSize.toString()}>
          <div>
            <div>
              <em>{formatNumber.format(marketSize)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(props.item?.marketSize)}
            </div>
          </div>
        </div>
        <div title={totalBorrows.toString()}>
          <div>
            <div>
              <em>{formatNumber.format(totalBorrows)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(props.item?.borrowed)}
            </div>
          </div>
        </div>
        <div title={depositAPY.toString()}>{formatPct.format(depositAPY)}</div>
        <div title={borrowAPY.toString()}>{formatPct.format(borrowAPY)}</div>
      </div>
    </Link>
  );
};
