import React from "react";
import { LABELS } from "../../constants";
import { LiquidateItem } from "./item";
import { useEnrichedLendingObligations } from "./../../hooks";
import "./style.less";

export const LiquidateView = () => {
  const { obligations } = useEnrichedLendingObligations();

  return (
    <div className="liquidate-container">
      {obligations.length === 0 ? (
        <div className="liquidate-info">{LABELS.LIQUIDATE_NO_LOANS}</div>
      ) : (
        <div className="flexColumn">
          <div className="liquidate-item liquidate-header">
            <div>{LABELS.TABLE_TITLE_ASSET}</div>
            <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_COLLATERAL_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APY}</div>
            <div>{LABELS.TABLE_TITLE_LTV}</div>
            <div>{LABELS.TABLE_TITLE_HEALTH}</div>
            <div>{LABELS.TABLE_TITLE_ACTION}</div>
          </div>
          {obligations.map((item) => (
            <LiquidateItem
              key={item.account.pubkey.toBase58()}
              item={item}
            ></LiquidateItem>
          ))}
        </div>
      )}
    </div>
  );
};
