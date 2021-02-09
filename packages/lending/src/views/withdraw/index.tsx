import React from "react";
import { useLendingReserve } from "../../hooks";
import { useParams } from "react-router-dom";
import "./style.less";

import { WithdrawInput } from "../../components/WithdrawInput";
import { DepositInfoLine } from "../../components/DepositInfoLine";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";

export const WithdrawView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return (
    <div className="deposit-reserve">
      <DepositInfoLine
        className="deposit-reserve-item"
        reserve={reserve}
        address={lendingReserve.pubkey}
      />
      <div className="deposit-reserve-container">
        <WithdrawInput
          className="deposit-reserve-item deposit-reserve-item-left"
          reserve={reserve}
          address={lendingReserve.pubkey}
        />
        <SideReserveOverview
          className="deposit-reserve-item deposit-reserve-item-right"
          reserve={lendingReserve}
          mode={SideReserveOverviewMode.Deposit}
        />
      </div>
    </div>
  );
};
