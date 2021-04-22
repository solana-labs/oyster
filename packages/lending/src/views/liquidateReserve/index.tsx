import { Col, Row } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';

import { LiquidateInput } from '../../components/LiquidateInput';

import { LoanInfoLine } from '../../components/LoanInfoLine';
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from '../../components/SideReserveOverview';
import { GUTTER } from '../../constants';
import { useEnrichedLendingObligation, useLendingReserve } from '../../hooks';

import './style.less';

export const LiquidateReserveView = () => {
  const { id } = useParams<{ id: string }>();

  const obligation = useEnrichedLendingObligation(id);

  const repayReserve = useLendingReserve(obligation?.info.borrowReserve);
  const withdrawReserve = useLendingReserve(obligation?.info.depositReserve);

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
