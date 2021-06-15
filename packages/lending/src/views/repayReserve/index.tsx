import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { BarChartStatistic } from '../../components/BarChartStatistic';

import { RepayInput } from '../../components/RepayInput';
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from '../../components/SideReserveOverview';
import { GUTTER, LABELS } from '../../constants';
import {
  useBorrowingPower,
  useEnrichedLendingObligation,
  useLendingReserve,
  useUserObligations,
} from '../../hooks';

import './style.less';

export const RepayReserveView = () => {
  const { reserve: reserveId, obligation: obligationId } = useParams<{
    reserve?: string;
    obligation?: string;
  }>();

  const lendingObligation = useEnrichedLendingObligation(obligationId);
  // @FIXME: obligation can have no borrows
  const id = obligationId ? lendingObligation?.info.borrows[0].borrowReserve : reserveId;
  const lendingReserve = useLendingReserve(id);

  // @FIXME: obligation can have no deposits
  const repayReserve = useLendingReserve(
    obligationId ? lendingObligation?.info.deposits[0].depositReserve : reserveId,
  );

  const { userObligations, totalInQuote: loansValue } = useUserObligations();
  const { totalInQuote: borrowingPower, utilization } = useBorrowingPower(id);

  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve || !lendingObligation || !repayReserve) {
    return null;
  }

  return (
    <div className="repay-reserve">
      <Row gutter={GUTTER}>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title={LABELS.BORROWED_VALUE}
              value={loansValue}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title={LABELS.BORROWING_POWER_USED}
              value={utilization * 100}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} xl={5}>
          <Card>
            <Statistic
              title={LABELS.BORROWING_POWER_VALUE}
              value={borrowingPower}
              valueStyle={{ color: '#3fBB00' }}
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
              getPct={item => item.obligation.info.borrowedInQuote / loansValue}
              name={item => item.obligation.info.repayName}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={GUTTER} style={{ flex: 1 }}>
        <Col xs={24} xl={15}>
          <RepayInput
            className="card-fill"
            borrowReserve={lendingReserve}
            depositReserve={repayReserve}
            obligation={lendingObligation}
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
