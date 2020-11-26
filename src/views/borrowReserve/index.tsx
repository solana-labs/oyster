import React from "react";
import { useLendingReserve } from "../../hooks";
import { useParams } from "react-router-dom";
import "./style.less";

import { BorrowInput } from "../../components/BorrowInput";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";

export const BorrowReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);

  if (!lendingReserve) {
    return null;
  }

  return (
    <div className="borrow-reserve">
      <div className="borrow-reserve-container">
        <BorrowInput
          className="borrow-reserve-item borrow-reserve-item-left"
          reserve={lendingReserve}
        />
        <SideReserveOverview
          className="borrow-reserve-item borrow-reserve-item-right"
          reserve={lendingReserve}
          mode={SideReserveOverviewMode.Borrow}
        />
      </div>
    </div>
  );
};
