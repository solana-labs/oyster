import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from './../../../hooks';
import { LendingReserve, LendingReserveParser } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber } from "../../../utils/utils";
import { Button, Card } from "antd";
import { useParams } from "react-router-dom";
import { cache, useAccount } from "../../../contexts/accounts";
import { NumericInput } from "../../../components/Input/numeric";
import { useConnection } from "../../../contexts/connection";
import { useWallet } from "../../../contexts/wallet";
import { deposit } from './../../../actions/deposit';
import './style.less';

import { DepositAdd } from './../../../components/DepositAdd';
import { DepositInfoLine } from './../../../components/DepositInfoLine';
import { SideReserveOverview, SideReserveOverviewMode } from './../../../components/SideReserveOverview';

export const DepositAddView = () => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return <div className="deposit-add">
    <DepositInfoLine 
        className="deposit-add-item"
        reserve={reserve}
        address={lendingReserve.pubkey} />
    <div className="deposit-add-container">
      <DepositAdd
        className="deposit-add-item deposit-add-item-left"
        reserve={reserve}
        address={lendingReserve.pubkey} />
      <SideReserveOverview
        className="deposit-add-item deposit-add-item-right"
        reserve={reserve}
        address={lendingReserve.pubkey}
        mode={SideReserveOverviewMode.Deposit} />
    </div>
  </div>;
}