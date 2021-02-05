import { Card } from "antd";
import React from "react";
import { BarChartStatistic } from "../../../components/BarChartStatistic";
import { LABELS } from "../../../constants";
import { formatNumber } from "../../../utils/utils";
import { useUserDeposits } from "./../../../hooks";
import { DepositItem } from "./item";

export const DashboardDeposits = () => {
  const { userDeposits, totalInQuote } = useUserDeposits();

  return (
    <Card
      title={
        <div className="dashboard-title">
          <div>{LABELS.DASHBOARD_TITLE_DEPOSITS}</div>
          <div>
            <span>{LABELS.TOTAL_TITLE}: </span>$
            {formatNumber.format(totalInQuote)}
          </div>
        </div>
      }
    >
      <BarChartStatistic
        items={userDeposits}
        getPct={(item) => item.info.amountInQuote / totalInQuote}
        name={(item) => item.info.name}
      />
      <div className="dashboard-item dashboard-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_DEPOSIT_BALANCE}</div>
        <div>{LABELS.TABLE_TITLE_APY}</div>
        <div></div>
      </div>
      {userDeposits.map((deposit) => (
        <DepositItem
          key={deposit.account.pubkey.toBase58()}
          userDeposit={deposit}
        />
      ))}
    </Card>
  );
};
