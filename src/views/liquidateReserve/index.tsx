import React from "react";
import { useParams } from "react-router-dom";
import { useEnrichedLendingObligation, useLendingReserve } from "../../hooks";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";

import { LoanInfoLine } from "../../components/LoanInfoLine";

import { LiquidateInput } from "../../components/LiquidateInput";

import "./style.less";
import { Col, Row } from "antd";
import { GUTTER } from "../../constants";

export const LiquidateReserveView = () => {
  const { id } = useParams<{ id: string }>();

  const obligation = useEnrichedLendingObligation(id);

  const repayReserve = useLendingReserve(obligation?.info.borrowReserve);
  const withdrawReserve = useLendingReserve(obligation?.info.collateralReserve);

  if (!obligation || !repayReserve) {
    return null;
  }

  return (
    <div className="borrow-reserve">
      <LoanInfoLine className="card-fill" obligation={obligation} />
      <Row gutter={GUTTER} style={{ flex: 1 }}>
        <Col xs={24} xl={15}>
          <LiquidateInput
            className="card-fill"
            obligation={obligation}
            withdrawReserve={withdrawReserve}
            repayReserve={repayReserve}
          />
        </Col>
        <Col xs={24} xl={9}>
          <SideReserveOverview
            className="card-fill"
            reserve={repayReserve}
            mode={SideReserveOverviewMode.Deposit}
          />
        </Col>
      </Row>
    </div>
  );
};
