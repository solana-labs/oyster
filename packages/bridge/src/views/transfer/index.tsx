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
            Aldrin didn’t build the Wormhole Bridge but simply offer an
            interface for it. Use it at your own risk. Aldrin team is not
            responsible for loss of funds. To avoid loss of funds, you should
            never close the page before the transfer is completed and you should
            strictly follow
            <a href={'https://aldrin-rin.medium.com/how-to-swap-erc20-wwt-to-solana-rin-using-wormhole-bridge-a8e805687ccd'} target="_blank" rel="noopener noreferrer">
              the instructions here.
            </a>
          </div>
        </div>{' '}
        <Transfer />
      </div>
    </>
  );
};

export {};
