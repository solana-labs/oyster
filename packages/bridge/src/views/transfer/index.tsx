import React from 'react';
import './index.less';
import { Card } from 'antd';
import { Transfer } from '../../components/Transfer';

export const TransferView = () => {
  return (
    <>
      <div
        className="flexColumn transfer-bg"
        style={{ flex: 1, minHeight: '90vh' }}
      >
        <Transfer />
      </div>
    </>
  );
};
