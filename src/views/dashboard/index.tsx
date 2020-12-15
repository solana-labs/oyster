import React from "react";
import { LABELS } from "../../constants";
import { useWallet } from "../../contexts/wallet";
import { useUserDeposits, useUserObligations } from "./../../hooks";
import { DepositItem } from "./depositItem";
import { ObligationItem } from "./obligationItem";
import "./style.less";

export const DashboardView = () => {
  const { connected } = useWallet();
  const { userObligations } = useUserObligations();
  const { userDeposits } = useUserDeposits();

  return (
    <div className="dashboard-container">
      {!connected && (
        <div className="dashboard-info">{LABELS.DASHBOARD_INFO}</div>
      )}
      {connected &&
        userDeposits.length === 0 &&
        userObligations.length === 0 && (
          <div className="dashboard-info">{LABELS.NO_LOANS_NO_DEPOSITS}</div>
        )}
      {userDeposits.length > 0 && (
        <div className="dashboard-left">
          <span>{LABELS.DASHBOARD_TITLE_DEPOSITS}</span>
          <div className="dashboard-item dashboard-header">
            <div>{LABELS.TABLE_TITLE_ASSET}</div>
            <div>{LABELS.TABLE_TITLE_DEPOSIT_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APY}</div>
            <div>{LABELS.TABLE_TITLE_ACTION}</div>
          </div>
          {userDeposits.map((deposit) => (
            <DepositItem reserve={deposit.reserve} account={deposit.account} />
          ))}
        </div>
      )}
      {userObligations.length > 0 && (
        <div className="dashboard-right">
          <span>{LABELS.DASHBOARD_TITLE_LOANS}</span>
          <div className="dashboard-item dashboard-header">
            <div>{LABELS.TABLE_TITLE_ASSET}</div>
            <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_COLLATERAL_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APY}</div>
            <div>{LABELS.TABLE_TITLE_ACTION}</div>
          </div>
          {userObligations.map((item) => {
            return <ObligationItem obligation={item.obligation} />;
          })}
        </div>
      )}
    </div>
  );
};
