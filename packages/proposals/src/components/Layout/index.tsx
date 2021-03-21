import React from 'react';
import './../../App.less';
import { Breadcrumb, Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import { contexts, components } from '@oyster/common';
import { Content, Header } from 'antd/lib/layout/layout';
import Logo from './dark-horizontal-combined-rainbow.inline.svg';

const { AppBar } = components;
const { useConnectionConfig } = contexts.Connection;

export const AppLayout = React.memo((props: any) => {
  const { env } = useConnectionConfig();
  const location = useLocation();

  const breadcrumbNameMap: any = {
    '/governance': 'Governance',
    '/apps/1': 'Application1',
    '/apps/2': 'Application2',
    '/apps/1/detail': 'Detail',
    '/apps/2/detail': 'Detail',
  };

  const pathSnippets = location.pathname.split('/').filter(i => i);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    return (
      <Breadcrumb.Item key={url}>
        <Link to={url}>{breadcrumbNameMap[url]}</Link>
      </Breadcrumb.Item>
    );
  });
  const breadcrumbItems = [
    <Breadcrumb.Item key="home">
      <Link to="/">Home</Link>
    </Breadcrumb.Item>,
  ].concat(extraBreadcrumbItems);

  // TODO: add breadcrumb

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
        <Content>
          {/* <Breadcrumb>{breadcrumbItems}</Breadcrumb> */}
          {props.children}
        </Content>
      </Layout>
    </div>
  );
});
