import React from "react";
import { useLendingReserve } from "./../../hooks";
import { useParams } from "react-router-dom";
import "./style.less";

import { UserLendingCard } from "./../../components/UserLendingCard";
import { ReserveStatus } from "./../../components/ReserveStatus";
import { Col, Row } from "antd";
import { GUTTER } from "../../constants";

export const ReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return (
    <div className="flexColumn">
      <Row gutter={GUTTER}>
        <Col sm={24} md={12} lg={14} xl={15} xxl={18}>
          <ReserveStatus reserve={reserve} address={lendingReserve.pubkey} />
        </Col>
        <Col sm={24} md={12} lg={10} xl={9} xxl={6}>
          <UserLendingCard
            className="user-lending-card"
            reserve={reserve}
            address={lendingReserve.pubkey}
          />
        </Col>
      </Row>
    </div>
  );
};
