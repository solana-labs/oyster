import React from "react";
import {
  useTokenName,
  useUserBalance,
  useUserCollateralBalance,
} from "./../../hooks";
import { LendingReserve } from "../../models/lending";
import { formatNumber } from "../../utils/utils";
import { Card } from "antd";
import "./style.less";
import { PublicKey } from "@solana/web3.js";

export const DepositInfoLine = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useUserCollateralBalance(props.reserve);

  return (
    <Card
      className={props.className}
      bodyStyle={{ display: "flex", justifyContent: "space-around" }}
    >
      <div className="deposit-info-line-item ">
        <div>Your balance in Oyster</div>
        <div>
          {formatNumber.format(collateralBalance)} {name}
        </div>
      </div>
      <div className="deposit-info-line-item ">
        <div>Your wallet balance</div>
        <div>
          {formatNumber.format(tokenBalance)} {name}
        </div>
      </div>
      <div className="deposit-info-line-item ">
        <div>Health factor</div>
        <div>--</div>
      </div>
    </Card>
  );
};
