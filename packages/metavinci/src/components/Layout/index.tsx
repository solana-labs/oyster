import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Button, Popover } from 'antd';

import './../../App.less';
import './index.less';
import { LABELS } from '../../constants';
import { AppBar } from '../AppBar';

const { Header, Content, Footer } = Layout;

export const AppLayout = React.memo((props: any) => {

  return (
    <>
      <div className="App">
        <Layout title={LABELS.APP_TITLE}>
          <Header className="App-Bar">
            <AppBar />
          </Header>
          <Content style={{ overflow: 'scroll' }}>
            {props.children}
          </Content>
        </Layout>
      </div>
    </>
  );
});
