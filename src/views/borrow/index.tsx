import React from "react";
import { LABELS } from "../../constants";
import { useLendingReserves } from "../../hooks";
import { BorrowItem } from "./item";
import "./itemStyle.less";

export const BorrowView = () => {
  const { reserveAccounts } = useLendingReserves();
  return (
    <div className="flexColumn">
      <div className="borrow-item deposit-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>Serum Dex Price</div>
        <div>{LABELS.TABLE_TITLE_MAX_BORROW}</div>
        <div>{LABELS.TABLE_TITLE_APY}</div>
        <div>{LABELS.TABLE_TITLE_ACTION}</div>
      </div>
      {reserveAccounts.map((account) => (
        <BorrowItem reserve={account.info} address={account.pubkey} />
      ))}
    </div>
  );
};
