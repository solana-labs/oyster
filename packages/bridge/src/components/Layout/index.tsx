import React from 'react';
import './../../App.less';
import './index.less';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import { AppBar } from '../AppBar';

const { Header, Content, Footer } = Layout;

export const AppLayout = React.memo((props: any) => {
  const location = useLocation();
  const isRoot = location.pathname === '/';

  return (
    <>
      <div className={`App`}>
        <Layout>
          <Header className="App-Bar" id={'app-header'}>
            <AppBar isRoot={isRoot} />
          </Header>
          <Content style={{ flexDirection: 'column' }}>
            {props.children}
          </Content>
          <Footer>
            <div
              className={'description-text'}
              style={{ color: '#2F506F' }}
            ></div>
          </Footer>
        </Layout>
      </div>
    </>
  );
});
