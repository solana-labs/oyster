import React from "react";
import { LendingReserve } from "../../models/lending";
import { Card } from "antd";
import { PublicKey } from "@solana/web3.js";
import "./style.less";
import { LABELS } from "../../constants";

export const ReserveStatus = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const bodyStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <Card
      className={props.className}
      title={<>{LABELS.RESERVE_STATUS_TITLE}</>}
      bodyStyle={bodyStyle}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        TODO: Reserve Status - add chart
      </div>
    </Card>
  );
};
