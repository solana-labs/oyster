import React from "react";
import {
  useUserCollateralBalance,
  useTokenName,
  useUserBalance,
} from "../../../hooks";
import { calculateDepositAPY, LendingReserve } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber, formatPct } from "../../../utils/utils";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { LABELS } from "../../../constants";

export const ReserveItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useUserCollateralBalance(
    props.reserve
  );

  const apy = calculateDepositAPY(props.reserve);

  return (
    <Link to={`/deposit/${props.address.toBase58()}`}>
      <div className="deposit-item">
        <span style={{ display: "flex" }}>
          <TokenIcon mintAddress={props.reserve.liquidityMint} />
          {name}
        </span>
        <div>
          {formatNumber.format(tokenBalance)} {name}
        </div>
        <div>
          {formatNumber.format(collateralBalance)} {name}
        </div>
        <div>{formatPct.format(apy)}</div>
        <div>
          <Button type="primary">
            <span>{LABELS.DEPOSIT_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
