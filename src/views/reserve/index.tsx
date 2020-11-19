import React, { useMemo } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from './../../hooks';
import { LendingReserve, LendingReserveParser } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button, Card } from "antd";
import { useParams } from "react-router-dom";
import { useAccount } from "../../contexts/accounts";

export const ReserveView = () => {
  const { id } = useParams<{ id: string }>();

  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  const name = useTokenName(reserve?.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(reserve?.liquidityMint);
  const { balance: collateralBalance } = useUserBalance(reserve?.collateralMint);

  return <Card>
    

  </Card>;
}