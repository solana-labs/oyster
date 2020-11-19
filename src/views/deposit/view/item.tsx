import React, { useMemo } from "react";
import { useTokenName, useUserAccounts, useUserBalance } from '../../../hooks';
import { LendingReserve } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber } from "../../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";

export const ReserveItem = (props: { reserve: LendingReserve, address: PublicKey }) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useUserBalance(props.reserve.collateralMint);

  return <Link to={`/deposit/${props.address.toBase58()}`}>
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <span style={{ display: 'flex' }}><TokenIcon mintAddress={props.reserve.liquidityMint} />{name}</span>
        <div>{formatNumber.format(tokenBalance)} {name}</div>
        <div>{formatNumber.format(collateralBalance)} {name}</div>
        <div>--</div>
        <Button>
          <span>Deposit</span>
        </Button>
      </div>
    </Card>
  </Link>;
}