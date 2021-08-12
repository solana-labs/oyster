import React, { useCallback } from 'react';
import { Card } from 'antd';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { contexts, utils, ConnectButton } from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';

const { useConnection } = contexts.Connection;
const { notify } = utils;

export const FaucetView = () => {
  const connection = useConnection();
  const { publicKey } = useWallet();

  const airdrop = useCallback(() => {
    if (!publicKey) {
        return;
    }

    connection
      .requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL)
      .then(() => {
        notify({
          message: LABELS.ACCOUNT_FUNDED,
          type: "success",
        });
      });
  }, [publicKey, connection]);

  const bodyStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  };

  return (
    <div className="flexColumn" style={{ flex: 1 }}>
      <Card title={"Faucet"} bodyStyle={bodyStyle} style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <div className="deposit-input-title" style={{ margin: 10 }}>
            {LABELS.FAUCET_INFO}
          </div>
          <ConnectButton type="primary" onClick={airdrop}>
            {LABELS.GIVE_SOL}
          </ConnectButton>
        </div>
      </Card>
    </div>
  );
};
