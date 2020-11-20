import React, {  } from "react";
import { useLendingReserve } from '../../hooks';
import { useParams } from "react-router-dom";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import './style.less';

import { BorrowInput } from '../../components/BorrowInput';
import { SideReserveOverview, SideReserveOverviewMode } from '../../components/SideReserveOverview';

export const BorrowReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return <div className="borrow-reserve">
    <div className="borrow-reserve-container">
      <BorrowInput
        className="borrow-reserve-item borrow-reserve-item-left"
        reserve={reserve}
        address={lendingReserve.pubkey} />
      <SideReserveOverview
        className="borrow-reserve-item borrow-reserve-item-right"
        reserve={reserve}
        address={lendingReserve.pubkey}
        mode={SideReserveOverviewMode.Borrow} />
    </div>
  </div>;
}