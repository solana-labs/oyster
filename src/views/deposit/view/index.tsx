import { Card } from "antd";
import React from "react";
import { useLendingReserves } from "../../../hooks";
import { ReserveItem } from "./item";
import "./itemStyle.less";

export const DepositView = () => {
  const { reserveAccounts } = useLendingReserves();
  return (
    <div className="flexColumn">
      <Card>
        <div className="deposit-item deposit-header">
          <div>Asset</div>
          <div>Your wallet balance</div>
          <div>Your balance in Oyster</div>
          <div>APY</div>
          <div></div>
        </div>
        {reserveAccounts.map((account) => (
          <ReserveItem
            key={account.pubkey.toBase58()}
            reserve={account.info}
            address={account.pubkey}
          />
        ))}
      </Card>
    </div>
  );
};
