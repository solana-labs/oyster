import React, { useMemo } from "react";
import { useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button } from "antd";

export const BorrowView = () => {

  return <div style={{ display: 'flex', justifyContent: 'space-around' }}>
    Borrow
  </div>;
}