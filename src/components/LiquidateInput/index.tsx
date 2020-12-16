import { Button } from "antd";
import Card from "antd/lib/card";
import React, { useCallback } from "react";
import { useState } from "react";
import { LABELS } from "../../constants";
import { ParsedAccount } from "../../contexts/accounts";
import { LendingObligation, LendingReserve } from "../../models";
import { BackButton } from "../BackButton";
import { CollateralSelector } from "../CollateralSelector";
import "./style.less";

export const LiquidateInput = (props: {
  className?: string;
  reserve: ParsedAccount<LendingReserve>;
  collateralReserve?: ParsedAccount<LendingReserve>;
  obligation: ParsedAccount<LendingObligation>;
}) => {

  const { reserve, collateralReserve } = props;
  const [pendingTx, setPendingTx] = useState(false);

  const onLiquidate = useCallback(() => {
    setPendingTx(true);
    setPendingTx(false);
  }, []);

  const bodyStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  };

  return (
    <Card className={props.className} bodyStyle={bodyStyle} >
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
      }}>
        <div className="liquidate-input-title">{LABELS.SELECT_COLLATERAL}</div>
        <CollateralSelector
          reserve={reserve.info}
          collateralReserve={collateralReserve?.pubkey.toBase58()}
          disabled={true}
        />
        <Button
          type="primary"
          onClick={onLiquidate}
          loading={pendingTx}
        >
          {LABELS.LIQUIDATE_ACTION}
        </Button>
        <BackButton />
      </div>
    </Card>
  )
}