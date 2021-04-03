import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Button, Popover } from 'antd';

import './../../App.less';
import './index.less';

import { Settings } from '@oyster/common';
import { SettingOutlined } from '@ant-design/icons';
import { LABELS } from '../../constants';
import { AppBar } from '../AppBar';

const { Header, Content, Footer } = Layout;

export const AppLayout = React.memo((props: any) => {
  const location = useLocation();

  const isRoot = location.pathname === '/';

  return (
    <>
      <div className="App">
        <Layout title={LABELS.APP_TITLE}>
          <Header className="App-Bar">
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
          <Content>
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
