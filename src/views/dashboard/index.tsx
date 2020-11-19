import React, { useMemo } from "react";
import { useLendingReserves, useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button } from "antd";

export const DashboardView = () => {
  const { reserveAccounts } = useLendingReserves();

  return <div className="flexColumn">
    DASHBOARD: 
    TODO:
    1. Add deposits
    2. Add obligations
  </div>;
}