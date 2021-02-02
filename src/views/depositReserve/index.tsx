import React from "react";
import { useLendingReserve } from "../../hooks";
import { useParams } from "react-router-dom";
import "./style.less";

import { DepositInput } from "../../components/DepositInput";
import { DepositInfoLine } from "../../components/DepositInfoLine";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";
import { Col, Row } from "antd";
import { GUTTER } from "../../constants";

export const DepositReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return (
    <div className="borrow-reserve">
      <DepositInfoLine
        className="card-fill"
        reserve={reserve}
        address={lendingReserve.pubkey}
      />
      <Row gutter={GUTTER} style={{ flex: 1 }}>
        <Col xs={24} xl={15}>
          <DepositInput
            className="card-fill"
            reserve={reserve}
            address={lendingReserve.pubkey}
          />
        </Col>
        <Col xs={24} xl={9}>
          <SideReserveOverview
            className="card-fill"
            reserve={lendingReserve}
            mode={SideReserveOverviewMode.Deposit}
          />
        </Col>
      </Row>
    </div>
  );
};
