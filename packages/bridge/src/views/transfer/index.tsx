import React, { useCallback, useEffect } from 'react';
import { Card } from 'antd';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { contexts, utils, ConnectButton, useConnection, useWallet } from '@oyster/common';
import { useHistory, useLocation } from "react-router-dom";
import { Transfer } from '../../components/Transfer';
import { useEthereum } from '../../contexts';

export const TransferView = () => {
  const connection = useConnection();
  const { wallet, connected } = useWallet();
  const { connect: connectEth } = useEthereum();

  const tabStyle: React.CSSProperties = { width: 120 };
  const tabList = [
    {
      key: "eth",
      tab: <div style={tabStyle}>Transfer</div>,
      render: () => {
        return <Transfer />;
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

  useEffect(() => {

    // connectEth();

  }, [connected, connectEth])

  const location = useLocation();
  const history = useHistory();
  const activeTab = location.pathname.indexOf("sol") >= 0 ? "sol" : "eth";

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
    <div className="flexColumn" style={{ flex: 1 }}>
      <Card
        className="bridge-card"
        headStyle={{ padding: 0 }}
        bodyStyle={{ position: "relative" }}
        tabList={tabList}
        tabProps={{
          tabBarGutter: 0,
        }}
        activeTabKey={activeTab}
        onTabChange={(key) => {
          handleTabChange(key);
        }}>
          {tabList.find((t) => t.key === activeTab)?.render()}
      </Card>
    </div>
  );
};
