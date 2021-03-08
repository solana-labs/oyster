import React, { useState } from 'react';
import './../../App.less';
import './index.less';
import { Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import metamaskIcon from "../../assets/metamask.svg"

import { LABELS } from '../../constants';
import { contexts, AppBar, shortenAddress } from '@oyster/common';
import Wormhole from '../Wormhole';
import { useEthereum } from '../../contexts';

const { Header, Content } = Layout;
const { useConnectionConfig } = contexts.Connection;

export const AppLayout = React.memo((props: any) => {
  const { env } = useConnectionConfig();
  const location = useLocation();
  const [wormholeReady, setWormholeReady] = useState(false);
  const { accounts } = useEthereum();

  const paths: { [key: string]: string } = {
    '/faucet': '7',
  };

  const isRoot = location.pathname !== '/';

  const current =
    [...Object.keys(paths)].find(key => location.pathname.startsWith(key)) ||
    '';
  return (
    <div className={`App`}>
      <Wormhole onCreated={() => setWormholeReady(true)} show={true} rotate={isRoot}>
        <Layout title={LABELS.APP_TITLE}>
          {isRoot && (
            <Header className="App-Bar">
              <div className="app-title">
                <Link to="/"><h2>WORMHOLE</h2></Link>
              </div>
              <AppBar
                useWalletBadge={true}
                left={
                <>
                  {accounts[0] && (
                    <div>
                      <img
                        alt={"metamask-icon"}
                        width={20}
                        height={20}
                        src={metamaskIcon}
                        style={{ marginRight: 8 }}
                      />
                      {shortenAddress(accounts[0], 4)}
                    </div>
                  )}
                </>
              } />
            </Header>
          )}
          <Content style={{ padding: '0 50px' }}>{props.children}</Content>
        </Layout>
      </Wormhole>
    </div>
  );
});
