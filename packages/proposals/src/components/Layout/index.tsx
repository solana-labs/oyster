import React from 'react';
import './../../App.less';
import { Divider, Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import config from './../../../package.json';
import { contexts, components } from '@oyster/common';
import { NewProposalMenuItem } from '../../views/proposal/new';
import { RegisterGovernanceMenuItem } from '../../views/governance/register';
import { Content, Header } from 'antd/lib/layout/layout';
import Logo from './dark-horizontal-combined-rainbow.inline.svg';

const { AppBar } = components;
const { useConnectionConfig } = contexts.Connection;

export const AppLayout = React.memo((props: any) => {
  const { env } = useConnectionConfig();
  const location = useLocation();

  const paths: { [key: string]: string } = {
    '/': '1',
    '/dashboard': '2',
  };

  const current =
    [...Object.keys(paths)].find(key => location.pathname.startsWith(key)) ||
    '';
  const defaultKey = paths[current] || '1';
  const theme = 'dark';

  return (
    <div className="App">
      <Layout title={LABELS.APP_TITLE}>
        <Header className="App-Bar">
            <div className="app-title">
              <Link to="/">
                <img
                  alt={`Solana Logo Image`}
                  src={Logo}
                  style={{ height: 40 }}
                />
              </Link>
            </div>
            <AppBar
              useWalletBadge={true}
            />
          </Header>
        <Content style={{ padding: '0 50px', flexDirection: 'column' }}>
          {props.children}
        </Content>
      </Layout>
    </div>
  );
});
