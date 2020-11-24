import React from "react";
import { useUserObligations } from "./../../hooks";
import { ObligationItem } from "./obligationItem";

export const DashboardView = () => {
  const { userObligations } = useUserObligations();

  return (
    <div className="flexColumn">
      <div>
        <span>Loans</span>
        {userObligations.length > 0 && <div className="deposit-item deposit-header">
          <div>Asset</div>
          <div>Your loan balance</div>
          <div>APY</div>
          <div>Action</div>
        </div>}
        {userObligations.map((item) => {
          return <ObligationItem obligation={item.oblication} />;
        })}
      </div>
    </div>
  );
};
