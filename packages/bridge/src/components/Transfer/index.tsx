import React, { useCallback, useState } from 'react';
import { Button, Card } from 'antd';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LABELS } from '../../constants';
import { contexts, utils, ConnectButton, programIds } from '@oyster/common';
import { useHistory, useLocation } from "react-router-dom";
import { SolanaInput, EthereumInput } from "./../Input";

import './style.less';
import { ethers } from 'ethers';
import { ASSET_CHAIN } from '../../utils/assets';
import { BigNumber } from 'ethers/utils';
import { Erc20Factory } from '../../contracts/Erc20Factory';
import { ProgressUpdate, transfer, TransferRequest } from '../../models/bridge';
import { useEthereum } from '../../contexts';
import { Spin } from 'antd';

const { useConnection } = contexts.Connection;
const { useWallet } = contexts.Wallet;
const { notify } = utils;

export const typeToIcon = (type: string, isLast: boolean) => {
  const style: React.CSSProperties = { marginRight: 5 }
  switch(type) {
    case "user": return <span style={style}>🪓 </span>;
    case "done": return <span style={style}>✅ </span>;
    case "error": return <span style={style}>❌ </span>;
    case "wait": return isLast ? <Spin /> : <span style={style}> ✅ </span>;
    default: return null;
  }
}

export const Transfer = () => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const { provider } = useEthereum();
  const [request, setRequest] = useState<TransferRequest>({
    // TODO: update based on selected asset
    from: ASSET_CHAIN.Ethereum,
    toChain: ASSET_CHAIN.Solana,
  });
  const [steps, setSteps] = useState<ProgressUpdate[]>([]);

  return (
    <>
    <div className="exchange-card">
      <EthereumInput
          title="From Ethereum"
          setInfo={(info) => { request.info = info }}
          asset={request.asset}
          setAsset={(asset) => request.asset = asset}
          amount={request.amount}
          onInputChange={(amount) => {
            request.amount = amount || 0;
          }}
          />
      <Button type="primary" className="swap-button">
        ⇅
      </Button>
      <SolanaInput
          title="To Solana"
          onInputChange={() => {}}
          />
    </div>
    <ConnectButton type="primary" onClick={async () => {
        if(!wallet || !provider) {
          return;
        }

        let activeSteps: ProgressUpdate[] = [];
        try {
          await transfer(connection, wallet, request, provider, (update) => {
            if(update.replace) {
              activeSteps.pop();
              activeSteps = [...activeSteps, update];
            } else {
              activeSteps = [...activeSteps, update];
            }

            setSteps(activeSteps);
          });
        } catch {
          setTimeout(() => setSteps([]), 5000);
        }
      }}>
      Transfer
    </ConnectButton>
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
      {(() => {
        let group = '';
        return steps.map((step, i) => {
          let prevGroup = group;
          group = step.group;
          let newGroup = prevGroup !== group;
          return (
            <>
              {newGroup && <span>{group}</span>}
              <span style={{ marginLeft: 15 }}>{typeToIcon(step.type, (steps.length - 1) === i)} {step.message}</span>
            </>);
        });

        return null;
       })()}
    </div>
  </>
  );
};
