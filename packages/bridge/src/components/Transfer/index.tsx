import React, { useCallback } from 'react';
import { Button, Card } from 'antd';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { contexts, utils, ConnectButton } from '@oyster/common';
import { useHistory, useLocation } from "react-router-dom";

import './style.less';

const { useConnection } = contexts.Connection;
const { useWallet } = contexts.Wallet;
const { notify } = utils;

export const Transfer = () => {
  const connection = useConnection();
  const { wallet } = useWallet();

  const tabStyle: React.CSSProperties = { width: 120 };
  const tabList = [
    {
      key: "eth",
      tab: <div style={tabStyle}>Transfer</div>,
      render: () => {
        return <div>Bring assets to Solana</div>;
      },
    },
    {
      key: "sol",
      tab: <div style={tabStyle}>Wrap</div>,
      render: () => {
        return <div>Bring assets to Solana</div>;
      },
    },
  ];

  const location = useLocation();
  const history = useHistory();
  const activeTab = location.pathname.indexOf("eth") < 0 ? "sol" : "eth";

  const handleTabChange = (key: any) => {
    if (activeTab !== key) {
      if (key === "sol") {
        history.push("/move/sol");
      } else {
        history.push("/move/eth");
      }
    }
  };

  return (
    <>
    <div className="input-card">
      INPUT
      <Button type="primary" className="swap-button">
        ⇅
      </Button>
      OUTPUT
    </div>
    <ConnectButton type="primary">
      Transfer
    </ConnectButton>
  </>
  );
};
