import React from "react";
import { useEnrichedLendingObligation, useLendingReserve } from "../../hooks";
import { useParams } from "react-router-dom";

import { RepayInput } from "../../components/RepayInput";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";

import "./style.less";

export const RepayReserveView = () => {
  const { reserve: reserveId, obligation: obligationId } = useParams<{
    reserve?: string;
    obligation?: string;
  }>();

  const lendingObligation = useEnrichedLendingObligation(obligationId);
  const lendingReserve = useLendingReserve(
    obligationId ? lendingObligation?.info.borrowReserve : reserveId
  );


  const repayReserve = useLendingReserve(
    obligationId ? lendingObligation?.info.collateralReserve : reserveId
  );

  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve || !lendingObligation) {
    return null;
  }

  return (
    <div className="repay-reserve">
      <div className="repay-reserve-container">
        <RepayInput
          className="repay-reserve-item repay-reserve-item-left"
          borrowReserve={lendingReserve}
          collateralReserve={repayReserve}
          obligation={lendingObligation}
        />
        <SideReserveOverview
          className="repay-reserve-item repay-reserve-item-right"
          reserve={lendingReserve}
          mode={SideReserveOverviewMode.Borrow}
        />
      </div>
    </div>
  );
};
