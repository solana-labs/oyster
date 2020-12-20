import React from "react";
import { LABELS } from "../../../constants";
import { useUserDeposits } from "./../../../hooks";
import { DepositItem } from "./item";

export const DashboardDeposits = () => {
  const { userDeposits } = useUserDeposits();

  return (<>
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
  </>
  );
};
