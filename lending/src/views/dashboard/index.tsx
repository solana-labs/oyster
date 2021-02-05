import { Card, Col, Row } from "antd";
import React from "react";
import { GUTTER, LABELS } from "../../constants";
import { useWallet } from "../../contexts/wallet";
import { useUserDeposits, useUserObligations } from "./../../hooks";
import { DashboardObligations } from "./obligation";
import { DashboardDeposits } from "./deposit";
import "./style.less";
import { NothingBorrowedPanel } from "../../components/NothingBorrowedPanel";

export const DashboardView = () => {
  const { connected } = useWallet();
  const { userObligations } = useUserObligations();
  const { userDeposits } = useUserDeposits();

  return (
    <div className="dashboard-container">
      {!connected ? (
        <div className="dashboard-info">
          <img
            src="splash.svg"
            alt="connect your wallet"
            className="dashboard-splash"
          />
          {LABELS.DASHBOARD_INFO}
        </div>
      ) : userDeposits.length === 0 && userObligations.length === 0 ? (
        <div className="dashboard-info">
          <img
            src="splash.svg"
            alt="connect your wallet"
            className="dashboard-splash"
          />
          {LABELS.NO_LOANS_NO_DEPOSITS}
        </div>
      ) : (
        <Row gutter={GUTTER}>
          <Col md={24} xl={12} span={24}>
            {userDeposits.length > 0 ? (
              <DashboardDeposits />
            ) : (
              <Card>{LABELS.NO_DEPOSITS}</Card>
            )}
          </Col>
          <Col md={24} xl={12} span={24}>
            {userObligations.length > 0 ? (
              <DashboardObligations />
            ) : (
              <NothingBorrowedPanel />
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};
