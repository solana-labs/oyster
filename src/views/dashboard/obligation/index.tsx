import { Card } from "antd";
import React from "react";
import { BarChartStatistic } from "../../../components/BarChartStatistic";
import { LABELS } from "../../../constants";
import { formatNumber } from "../../../utils/utils";
import { useUserObligations } from "./../../../hooks";
import { ObligationItem } from "./item";

export const DashboardObligations = () => {
  const { userObligations, totalInQuote } = useUserObligations();

  return (
    <Card
      title={
        <div className="dashboard-title">
          <div>{LABELS.DASHBOARD_TITLE_LOANS}</div>
          <div>
            <span>{LABELS.TOTAL_TITLE}: </span>$
            {formatNumber.format(totalInQuote)}
          </div>
        </div>
      }
    >
      <BarChartStatistic
        items={userObligations}
        getPct={(item) => item.obligation.info.borrowedInQuote / totalInQuote}
        name={(item) => item.obligation.info.repayName}
      />
      <div className="dashboard-item dashboard-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_YOUR_LOAN_BALANCE}</div>
        <div>{LABELS.TABLE_TITLE_COLLATERAL_BALANCE}</div>
        <div>{LABELS.TABLE_TITLE_APY}</div>
        <div>{LABELS.TABLE_TITLE_LTV}</div>
        <div></div>
      </div>
      {userObligations.map((item) => {
        return (
          <ObligationItem
            key={item.obligation.account.pubkey.toBase58()}
            obligation={item.obligation}
          />
        );
      })}
    </Card>
  );
};
