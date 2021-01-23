import React from "react";
import { LABELS } from "../../constants";
import "./itemStyle.less";
import { Card } from "antd";
import { useLendingReserves } from "../../hooks/useLendingReserves";
import { MarginTradeItem } from "./item";

export const MarginTrading = () => {
  const { reserveAccounts } = useLendingReserves();
  return (
    <div className="flexColumn">
      <Card>
        <div className="choose-margin-item choose-margin-header">
          <div>{LABELS.TABLE_TITLE_ASSET}</div>
          <div>Serum Dex Price</div>
          <div>{LABELS.TABLE_TITLE_BUYING_POWER}</div>
          <div>{LABELS.TABLE_TITLE_APY}</div>
          <div></div>
        </div>
        {reserveAccounts.map((account) => (
          <MarginTradeItem reserve={account.info} address={account.pubkey} />
        ))}
      </Card>
    </div>
  );
};
