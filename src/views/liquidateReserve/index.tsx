import React from "react";
import { useParams } from "react-router-dom";
import { useLendingObligation, useLendingReserve } from "../../hooks";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";

import { LiquidateInput } from "../../components/LiquidateInput";

import "./style.less";

export const LiquidateReserveView = () => {
  const { id } = useParams<{ id: string }>();

  const obligation = useLendingObligation(id);
  const reserve = useLendingReserve(obligation?.info.borrowReserve);

  if (!obligation || !reserve) {
    return null;
  }

  return (
    <div className="liquidate-reserve">
      <div className="liquidate-reserve-container">
        <LiquidateInput
          className="liquidate-reserve-item liquidate-reserve-item-left"
          obligation={obligation}
          reserve={reserve}
        />
        <SideReserveOverview
          className="liquidate-reserve-item liquidate-reserve-item-right"
          reserve={reserve}
          mode={SideReserveOverviewMode.Deposit}
        />
      </div>
    </div>
  )
}