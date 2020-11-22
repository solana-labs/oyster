import React from "react";
import { useUserObligations } from "./../../hooks";

export const DashboardView = () => {
  const { userObligations } = useUserObligations();

  return (
    <div className="flexColumn">
      DASHBOARD: TODO: 1. Add deposits 2. Add obligations

      {userObligations.map(item => {
        return <div>{item?.oblication.info.borrowAmount.toString()}</div>;
      })}
    </div>
  );
};
