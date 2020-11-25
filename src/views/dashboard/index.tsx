import React from "react";
import { LABELS } from "../../constants";
import { useUserObligations } from "./../../hooks";
import { ObligationItem } from "./obligationItem";
import "./style.less";

export const DashboardView = () => {
  const { userObligations } = useUserObligations();

  return (
    <div className="dashboard-container">
      <div>
        <span>{LABELS.DASHBOARD_TITLE_DEPOSITS}</span>
      </div>
      <div>
        <span>{LABELS.DASHBOARD_TITLE_LOANS}</span>
        {userObligations.length > 0 && (
          <div className="dashboard-item dashboard-header">
            <div>{LABELS.TABLE_TITLE_ASSET}</div>
            <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APY}</div>
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
