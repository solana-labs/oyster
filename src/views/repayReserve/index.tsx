import React from "react";
import { useLendingReserve } from "../../hooks";
import { useParams } from "react-router-dom";

import { RepayInput } from "../../components/RepayInput";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";

import "./style.less";
import { LendingObligation } from "../../models";

export const RepayReserveView = () => {
  const { id, obligation } = useParams<{ id: string, obligation?: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return (
    <div className="repay-reserve">
      <div className="repay-reserve-container">
        <RepayInput
          className="repay-reserve-item repay-reserve-item-left"
          reserve={reserve}
          obligation={obligation}
          address={lendingReserve.pubkey}
        />
        <SideReserveOverview
          className="repay-reserve-item repay-reserve-item-right"
          reserve={reserve}
          address={lendingReserve.pubkey}
          mode={SideReserveOverviewMode.Borrow}
        />
      </div>
    </div>
  );
};
