import React, { useEffect, useState } from 'react';
import './../../App.less';
import './index.less';
import { Layout, Button, Popover } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import { AppBar } from '../AppBar';
import Wormhole from '../Wormhole';
import { Footer as AppFooter } from './../Footer';
import { EthereumConnect } from '../EthereumConnect';
import { useEthereum } from '../../contexts';
import { Settings } from '@oyster/common';
import { SettingOutlined } from '@ant-design/icons';

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
          <Header className="App-Bar">
            {!isRoot && (
              <div className="app-title app-left">
                <Link to="/">
                  <img alt="logo-bar" src={'/appbar/logo.svg'} />
                </Link>
              </div>
            )}
            <AppBar />
            {!isRoot && (
              <Popover
                placement="topRight"
                title={LABELS.SETTINGS_TOOLTIP}
                content={<Settings />}
                trigger="click"
              >
                <Button
                  className={'app-right'}
                  shape="circle"
                  size="large"
                  type="text"
                  icon={<SettingOutlined />}
                />
              </Popover>
            )}
          </Header>
          <Content style={{ flexDirection: 'column' }}>
            {props.children}
          </Content>
          <Footer>
            <div className={'description-text'} style={{ color: '#2F506F' }}>
              © Solana Foundation
            </div>
          </Footer>
        </Layout>
      </div>
    </>
  );
});
