import React from "react";
import { useBorrowingPower, useLendingReserve, useUserObligations } from "../../hooks";
import { useParams } from "react-router-dom";
import "./style.less";

import { BorrowInput } from "../../components/BorrowInput";
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from "../../components/SideReserveOverview";
import { Card, Col, Row, Statistic } from "antd";
import { BarChartStatistic } from "../../components/BarChartStatistic";
import { GUTTER } from "../../constants";

export const BorrowReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const { userObligations, totalInQuote: loansValue } = useUserObligations();

  const { totalInQuote: borrowingPower } = useBorrowingPower(id)

  if (!lendingReserve) {
    return null;
  }

  const numberOfLoans = userObligations
    .filter(ob =>
      // ob.obligation.info.borrowReserve.toBase58() === id &&
      ob.obligation.info.collateralInQuote > 0)
    .length;

  return (
    <div className="borrow-reserve">
      <Row gutter={GUTTER}>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title="Your loans value"
              value={loansValue}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title="Number of loans"
              value={numberOfLoans}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title="Borrowing power"
              value={borrowingPower}
              valueStyle={{ color: "#3f8600" }}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card>
            <BarChartStatistic
              title="Your Loans"
              items={userObligations}
              getPct={(item) => item.obligation.info.borrowedInQuote / loansValue}
              name={(item) => item.obligation.info.repayName} />
          </Card>
        </Col>
      </Row>
      <Row gutter={GUTTER} className="flexColumn">
        <Col xs={24} xl={15}>
          <BorrowInput
            className="card-fill"
            reserve={lendingReserve}
          />
        </Col>
        <Col xs={24} xl={9}>
          <SideReserveOverview
            className="card-fill"
            reserve={lendingReserve}
            mode={SideReserveOverviewMode.Borrow}
          />
        </Col>
      </Row>
    </div>
  );
};
