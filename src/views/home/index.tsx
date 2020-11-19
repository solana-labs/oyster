import React, { useMemo } from "react";
import { useLendingReserves, useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button } from "antd";
import { LendingReserveItem } from "./item";
import './itemStyle.less';

export const HomeView = () => {
  const { reserveAccounts } = useLendingReserves();

  // TODO: add total Liquidity amount ...

  return <div className="flexColumn">
    <div className="home-item home-header">
      <div>Asset</div>
      <div>Market Size</div>
      <div>Total Borrowed</div>
      <div>Deposit APY</div>
      <div>Borrow APY</div>
    </div>
    {reserveAccounts.map(account => <LendingReserveItem reserve={account.info} address={account.pubkey} />)}
  </div>;
}