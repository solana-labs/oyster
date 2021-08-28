import React from 'react';
import './index.less';
import { Transfer } from '../../components/Transfer';
// import { Warning } from '../../components/Warning';

export const TransferView = () => {
  return (
    <>
      <div className="flexColumn transfer-bg" style={{ flex: 1 }}>
        <Transfer />

        <div className="warning-box">
          <h2>Warning</h2>
          <span>
            To avoid loss of funds, you should never close the page before the
            transfer is completed and you should strictly follow the
            instructions here. Also make sure you have enough ETH and SOL to pay
            the fees.
          </span>
        </div>
      </div>
    </>
  );
};

export {};
