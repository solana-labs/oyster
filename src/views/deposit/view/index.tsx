import React from "react";
import { Input } from "antd";
import { useLendingReserves, useTokenName } from '../../../hooks';
import { LendingReserve } from "../../../models/lending";
import { getTokenName } from "../../../utils/utils";
import { useConnectionConfig } from "../../../contexts/connection";
import { TokenIcon } from "../../../components/TokenIcon";
import { ReserveItem } from './item';
import './itemStyle.less';

export const DepositView = () => {
  const { reserveAccounts } = useLendingReserves();
  return (
    <div className="flexColumn">
      <div className="deposit-item deposit-header">
        <div>Asset</div>
        <div>Your wallet balance</div>
        <div>Your balance in Oyster</div>
        <div>APY</div>
        <div>Action</div>
      </div>
      {reserveAccounts.map(account => <ReserveItem reserve={account.info} address={account.pubkey} />)}
    </div>
  );
};