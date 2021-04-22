import { Col, Row } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ReserveStatus } from '../../components/ReserveStatus';

import { UserLendingCard } from '../../components/UserLendingCard';
import { GUTTER } from '../../constants';
import { useLendingReserve } from '../../hooks';
import './style.less';

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
