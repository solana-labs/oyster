import React from "react";
import { useLendingReserves } from "../../hooks";
import { BorrowItem } from "./item";
import "./itemStyle.less";

export const BorrowView = () => {
  const { reserveAccounts } = useLendingReserves();
  return (
    <div className="flexColumn">
      <div className="borrow-item deposit-header">
        <div>Asset</div>
        <div>Available fro you</div>
        <div>APY</div>
        <div>Action</div>
      </div>
      {reserveAccounts.map((account) => (
        <BorrowItem reserve={account.info} address={account.pubkey} />
      ))}
    </div>
  );
};
