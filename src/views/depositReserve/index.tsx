import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLendingReserve, useTokenName, useUserAccounts, useUserBalance } from '../../hooks';
import { LendingReserve, LendingReserveParser } from "../../models/lending";
import { TokenIcon } from "../../components/TokenIcon";
import { formatNumber } from "../../utils/utils";
import { Button, Card } from "antd";
import { useParams } from "react-router-dom";
import { cache, useAccount } from "../../contexts/accounts";
import { NumericInput } from "../../components/Input/numeric";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { deposit } from '../../actions/deposit';
import './style.less';

import { DepositInput } from '../../components/DepositInput';
import { DepositInfoLine } from '../../components/DepositInfoLine';
import { SideReserveOverview, SideReserveOverviewMode } from '../../components/SideReserveOverview';

export const DepositReserveView = () => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return <div className="deposit-reserve">
    <DepositInfoLine 
        className="deposit-reserve-item"
        reserve={reserve}
        address={lendingReserve.pubkey} />
    <div className="deposit-reserve-container">
      <DepositInput
        className="deposit-reserve-item deposit-reserve-item-left"
        reserve={reserve}
        address={lendingReserve.pubkey} />
      <SideReserveOverview
        className="deposit-reserve-item deposit-reserve-item-right"
        reserve={reserve}
        address={lendingReserve.pubkey}
        mode={SideReserveOverviewMode.Deposit} />
    </div>
  </div>;
}