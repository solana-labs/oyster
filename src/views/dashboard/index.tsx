import React from "react";
import { LABELS } from "../../constants";
import { useUserDeposits, useUserObligations } from "./../../hooks";
import { DepositItem } from "./depositItem";
import { ObligationItem } from "./obligationItem";
import "./style.less";

export const DashboardView = () => {
  const { userObligations } = useUserObligations();
  const { userDeposits } = useUserDeposits();

  return (
    <div className="dashboard-container">
      <div className="dashboard-left">
        <span>{LABELS.DASHBOARD_TITLE_DEPOSITS}</span>
        {userDeposits.length > 0 && (
          <div className="dashboard-item dashboard-header">
            <div>{LABELS.TABLE_TITLE_DEPOSIT_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APY}</div>
            <div>{LABELS.TABLE_TITLE_ACTION}</div>
          </div>
        )}
        {userDeposits.map(deposit => <DepositItem reserve={deposit.reserve} account={deposit.account} />)

        }
      </div>
      <div className="dashboard-right">
        <span>{LABELS.DASHBOARD_TITLE_LOANS}</span>
        {userObligations.length > 0 && (
          <div className="dashboard-item dashboard-header">
            <div>{LABELS.TABLE_TITLE_ASSET}</div>
            <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APR}</div>
            <div>{LABELS.TABLE_TITLE_ACTION}</div>
          </div>
        )}
        {userObligations.map((item) => {
          return <ObligationItem obligation={item.obligation} />;
        })}
      </div>
    </div>
  );
};
