import React, { useMemo } from "react";
import { useTokenName, useUserAccounts, useUserBalance } from '../../../hooks';
import { LendingReserve } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber } from "../../../utils/utils";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";

export const ReserveItem = (props: { reserve: LendingReserve, address: PublicKey }) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const tokenBalance = useUserBalance(props.reserve.liquidityMint);
  const collateralBalance = useUserBalance(props.reserve.collateralMint);

  return <div style={{ display: 'flex', justifyContent: 'space-around' }}>
    <span style={{ display: 'flex' }}><TokenIcon mintAddress={props.reserve.liquidityMint} />{name}</span>
    <div>{formatNumber.format(tokenBalance)} {name}</div>
    <div>{formatNumber.format(collateralBalance)} {name}</div>
    <div>--</div>
    <Link to={`/deposit/${props.address.toBase58()}`}>
      <Button>
        <span>Deposit</span>
      </Button>
    </Link>
  </div>;
}