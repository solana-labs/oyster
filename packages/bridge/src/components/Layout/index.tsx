import React, { useEffect, useState } from 'react';
import './../../App.less';
import './index.less';
import { Layout, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import { AppBar } from '@oyster/common';
import Wormhole from '../Wormhole';
import { Footer as AppFooter } from './../Footer';
import { EthereumConnect } from '../EthereumConnect';
import { useEthereum } from '../../contexts';

const { Header, Content, Footer } = Layout;

export const AppLayout = React.memo((props: any) => {
  const { connected, disconnect } = useEthereum();
  const location = useLocation();
  const [wormholeReady, setWormholeReady] = useState(false);

  const paths: { [key: string]: string } = {
    '/faucet': '7',
  };

  const isRoot = location.pathname === '/';

  const current =
    [...Object.keys(paths)].find(key => location.pathname.startsWith(key)) ||
    '';
  return (
    <>
      <div className={`App`}>
        <Layout title={LABELS.APP_TITLE}>
          {!isRoot && (
            <Header className="App-Bar">
              <div className="app-title">
                <Link to="/">
                  <h2>WORMHOLE</h2>
                </Link>
              </div>
              <AppBar
                additionalSettings={
                  connected ? (
                    <Button
                      type="primary"
                      onClick={() => disconnect()}
                      style={{ marginTop: '8px' }}
                    >
                      Disconnect ETH
                    </Button>
                  ) : undefined
                }
                useWalletBadge={true}
                left={<EthereumConnect />}
              />
            </Header>
          )}
          <Content style={{ flexDirection: 'column' }}>
            {props.children}
          </Content>
          {/*<Footer style={{ textAlign: 'center' }}>*/}
          {/*  <AppFooter />*/}
          {/*</Footer>*/}
        </Layout>
      </div>
    </>
  );
});
