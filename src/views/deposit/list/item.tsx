import React, { useMemo } from "react";
import { useTokenName, useUserAccounts, useUserBalance } from './../../../hooks';
import { LendingReserve } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber } from "../../../utils/utils";
import { Button } from "antd";

export const ReserveItem = (props: { reserve: LendingReserve }) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const tokenBalance = useUserBalance(props.reserve.liquidityMint);
  const collateralBalance = useUserBalance(props.reserve.collateralMint);

  return <div style={{ display: 'flex', justifyContent: 'space-around' }}>
    <TokenIcon mintAddress={props.reserve.liquidityMint} />
    {name}
    <div>{formatNumber.format(tokenBalance)} {name}</div>
    <div>{formatNumber.format(collateralBalance)} {name}</div>
    <Button >Deposit</Button>
  </div>;
}