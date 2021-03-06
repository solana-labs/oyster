import React, { useCallback, useEffect } from 'react';
import { Card } from 'antd';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { contexts, utils, ConnectButton, useConnection, useWallet } from '@oyster/common';
import { useHistory, useLocation } from "react-router-dom";
import { Transfer } from '../../components/Transfer';
import { useEthereum } from '../../contexts';
import { Wrap } from "../../components/Wrap";
const { notify } = utils;

export const TransferView = () => {
  const connection = useConnection();
  const { wallet, connected } = useWallet();
  const { connect: connectEth } = useEthereum();

  useEffect(() => {

    // connectEth();

  }, [connected, connectEth])

  return (
    <div className="flexColumn" style={{ flex: 1 }}>
      <Card
        className="bridge-card"
        headStyle={{ padding: 0 }}
        bodyStyle={{ position: "relative" }}
        >
          <Transfer />
      </Card>
    </div>
  );
};
