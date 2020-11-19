import React, { useMemo } from "react";
import { useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber, fromLamports } from "../../utils/utils";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useAccount, useMint } from "../../contexts/accounts";

export const LendingReserveItem = (props: { reserve: LendingReserve, address: PublicKey }) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useUserBalance(props.reserve.collateralMint);

  const collateralSupply = useAccount(props.reserve.collateralSupply);
  const liquiditySupply = useAccount(props.reserve.liquiditySupply);
  const liquidityMint = useMint(props.reserve.liquidityMint);

  const totalLiquidity = fromLamports(props.reserve.totalLiquidity.toNumber(), liquidityMint);
  const totalBorrows = props.reserve.totalBorrows.toString();

  console.log(liquidityMint);

  return <Link to={`/reserve/${props.address.toBase58()}`}>
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <span style={{ display: 'flex' }}><TokenIcon mintAddress={props.reserve.liquidityMint} />{name}</span>
        <div>{formatNumber.format(totalLiquidity)} {name}</div>
        <div>{totalBorrows} {name}</div>
        <div>--</div>
      </div>

    </Card>
  </Link>;
}