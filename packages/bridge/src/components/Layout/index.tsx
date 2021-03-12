import React, { useEffect, useState } from 'react';
import './../../App.less';
import './index.less';
import { Layout, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import metamaskIcon from '../../assets/metamask.svg';

import { LABELS } from '../../constants';
import { contexts, AppBar, shortenAddress, useWallet } from '@oyster/common';
import Wormhole from '../Wormhole';
import { useEthereum } from '../../contexts';
import { useCorrectNetwork } from '../../hooks/useCorrectNetwork';
import { SecurityAuditButton } from '../SecurityAuditButton';
import { Footer } from '../Footer';

const { Header, Content } = Layout;
const { useConnectionConfig } = contexts.Connection;

export const AppLayout = React.memo((props: any) => {
  const location = useLocation();
  const [wormholeReady, setWormholeReady] = useState(false);
  const { accounts, provider } = useEthereum();
  const hasCorrespondingNetworks = useCorrectNetwork();

  const paths: { [key: string]: string } = {
    '/faucet': '7',
  };

  const isRoot = location.pathname !== '/';

  const current =
    [...Object.keys(paths)].find(key => location.pathname.startsWith(key)) ||
    '';
  return (
    <>
      <div className={`App`}>
        <Wormhole
          onCreated={() => setWormholeReady(true)}
          show={true}
          rotate={isRoot}
        >
          <Layout title={LABELS.APP_TITLE}>
            {isRoot && (
              <Header className="App-Bar">
                <div className="app-title">
                  <Link to="/">
                    <h2>WORMHOLE</h2>
                  </Link>
                </div>
                <AppBar
                  useWalletBadge={true}
                  left={
                    <>
                      {accounts[0] && (
                        <div style={{ marginRight: 8 }}>
                          {hasCorrespondingNetworks ? (
                            <>
                              <img
                                alt={'metamask-icon'}
                                width={20}
                                height={20}
                                src={metamaskIcon}
                              />
                              {shortenAddress(accounts[0], 4)}
                            </>
                          ) : (
                            <Button danger type={'primary'}>
                              WRONG NETWORK
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  }
                />
              </Header>
            )}
            <Content style={{ padding: '0 50px', flexDirection: 'column' }}>
              {props.children}
            </Content>
          </Layout>
        </Wormhole>
      </div>
    </>
  );
});
