import React from "react";
import { useUserCollateralBalance, useTokenName } from "../../hooks";
import { calculateBorrowAPY, LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber, formatPct } from "../../utils/utils";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { LABELS } from "../../constants";
import { useMidPriceInUSD } from "../../contexts/market";

export const BorrowItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const price = useMidPriceInUSD(props.reserve.liquidityMint.toBase58()).price;

  // TODO: calculate avilable amount... based on total owned collateral across all the reserves
  const { balance: collateralBalance, balanceInUSD: collateralBalanceInUSD } = useUserCollateralBalance(
    props.reserve
  );

  const apr = calculateBorrowAPY(props.reserve);

  return (
    <Link to={`/borrow/${props.address.toBase58()}`}>
      <div className="borrow-item">
        <span style={{ display: "flex" }}>
          <TokenIcon mintAddress={props.reserve.liquidityMint} />
          {name}
        </span>
        <div>${formatNumber.format(price)}</div>
        <div>
          <div>
            <div><em>{formatNumber.format(collateralBalance)}</em> {name}</div>
            <div className="dashboard-amount-quote">${formatNumber.format(collateralBalanceInUSD)}</div>
          </div>
        </div>
        <div>{formatPct.format(apr)}</div>
        <div>
          <Button type="primary">
            <span>{LABELS.BORROW_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
