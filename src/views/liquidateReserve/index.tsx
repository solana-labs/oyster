import React from "react";
import { useParams } from "react-router-dom";
import { useLendingObligation, useLendingReserve } from "../../hooks";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";
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
        <div
          className="liquidate-reserve-item liquidate-reserve-item-left"

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