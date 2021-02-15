import React from 'react';
import './../../App.less';
import { Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import { contexts, AppBar } from '@oyster/common';


const { Header, Content } = Layout;
const { useConnectionConfig } = contexts.Connection;

export const AppLayout = React.memo((props: any) => {
  const { env } = useConnectionConfig();
  const location = useLocation();

  const paths: { [key: string]: string } = {
    '/faucet': '7',
  };

  const current =
    [...Object.keys(paths)].find(key => location.pathname.startsWith(key)) ||
    '';
  return (
    <div className="App wormhole-bg">
      <Layout
        title={LABELS.APP_TITLE}
      >
        {location.pathname !== '/' && <Header className="App-Bar">
          <div className="app-title"><h2>WORMHOLE</h2></div>
          <AppBar />
        </Header>}
        <Content style={{ padding: '0 50px' }}>
          {props.children}
        </Content>
      </Layout>
    </div>
  );
});
