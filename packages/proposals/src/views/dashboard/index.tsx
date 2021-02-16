import { Card, Col, Row } from 'antd';
import React from 'react';
import { GUTTER, LABELS } from '../../constants';
import { contexts } from '@oyster/common';
import './style.less';
const { useWallet } = contexts.Wallet;

export const DashboardView = () => {
  const { connected } = useWallet();

  return (
    <div className="dashboard-container">
      <Row gutter={GUTTER}></Row>
    </div>
  );
};
