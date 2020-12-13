import React from "react";
import { LABELS } from "../../constants";
import { LiquidateItem } from "./item";
import { useLiquidableObligations } from "./../../hooks";
import "./style.less";

export const LiquidateView = () => {
  const { liquidableObligations } = useLiquidableObligations();

  return (
    <div className="liquidate-container">
      {liquidableObligations.length === 0 && (
        <div className="liquidate-info">{LABELS.LIQUIDATE_NO_LOANS}</div>
      )}
      {liquidableObligations.length > 0 && (
        <div className="flexColumn">
          <div className="liquidate-item liquidate-header">
            <div>{LABELS.TABLE_TITLE_ASSET}</div>
            <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
            <div>{LABELS.TABLE_TITLE_APY}</div>
            <div>{LABELS.TABLE_TITLE_LTV}</div>
            <div>{LABELS.TABLE_TITLE_ACTION}</div>
          </div>
          {liquidableObligations.map((item) => (
            <LiquidateItem key={item.obligation.pubkey.toBase58()} obligation={item.obligation} ltv={item.ltv}></LiquidateItem>
          ))}
        </div>
      )}
    </div>
  );
};
