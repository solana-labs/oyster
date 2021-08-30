import React from 'react';
import './index.less';
import { Transfer } from '../../components/Transfer';
// import { Warning } from '../../components/Warning';

export const TransferView = () => {
  return (
    <>
      <div className="flexColumn transfer-bg" style={{ flex: 1 }}>
        <div className="warning-box">
          <div className="header-warning">Warning</div>
          <div className="description-warning">
            To avoid loss of funds, you should never close the page before the
            transfer is completed and you should strictly follow the
            <a href={''} target="_blank" rel="noopener noreferrer">
              instructions here.
            </a>
            Also make sure you have enough ETH and SOL to pay the fees.
          </div>
        </div>{' '}
        <Transfer />
      </div>
    </>
  );
};

export {};
