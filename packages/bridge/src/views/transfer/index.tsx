import React from 'react';
import { Card } from 'antd';
import { Transfer } from '../../components/Transfer';

export const TransferView = () => {
  return (
    <>
      <div className="flexColumn" style={{ flex: 1, minHeight: '90vh' }}>
        <Card
          className="bridge-card"
          headStyle={{ padding: 0 }}
          bodyStyle={{ position: 'relative' }}
        >
          <Transfer />
        </Card>
      </div>
    </>
  );
};
