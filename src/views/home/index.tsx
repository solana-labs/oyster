import React from "react";
import { LABELS } from "../../constants";
import { useLendingReserves } from "../../hooks";
import { LendingReserveItem } from "./item";
import "./itemStyle.less";

export const HomeView = () => {
  const { reserveAccounts } = useLendingReserves();

  // TODO: add total Liquidity amount ...

  return (
    <div className="flexColumn">
      <div className="home-item home-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_MARKET_SIZE}</div>
        <div>{LABELS.TABLE_TITLE_TOTAL_BORROWED}</div>
        <div>{LABELS.TABLE_TITLE_DEPOSIT_APR}</div>
        <div>{LABELS.TABLE_TITLE_BORROW_APR}</div>
      </div>
      {reserveAccounts.map((account) => (
        <LendingReserveItem reserve={account.info} address={account.pubkey} />
      ))}
    </div>
  );
};
