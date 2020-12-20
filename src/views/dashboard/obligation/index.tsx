import React from "react";
import { LABELS } from "../../../constants";
import { useUserObligations } from "./../../../hooks";
import { ObligationItem } from "./item";

export const DashboardObligations = () => {
  const { userObligations } = useUserObligations();

  return (
    <>
      <span>{LABELS.DASHBOARD_TITLE_LOANS}</span>
      <div className="dashboard-item dashboard-header">
        <div>{LABELS.TABLE_TITLE_ASSET}</div>
        <div>{LABELS.TABLE_TITLE_YOUR_LOAN_BALANCE}</div>
        <div>{LABELS.TABLE_TITLE_COLLATERAL_BALANCE}</div>
        <div>{LABELS.TABLE_TITLE_APY}</div>
        <div>{LABELS.TABLE_TITLE_LTV}</div>
        <div>{LABELS.TABLE_TITLE_ACTION}</div>
      </div>
      {userObligations.map((item) => {
        return <ObligationItem obligation={item.obligation} />;
      })}
    </>
  );
};
