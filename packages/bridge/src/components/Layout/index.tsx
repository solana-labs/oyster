import React from 'react';
import './../../App.less';
import { Menu } from 'antd';
import {
  PieChartOutlined,
  GithubOutlined,
  BankOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  HomeOutlined,
  RocketOutlined,
  ForkOutlined,
  // LineChartOutlined
} from '@ant-design/icons';

import BasicLayout from '@ant-design/pro-layout';
import { AppBar } from './../AppBar';
import { Link, useLocation } from 'react-router-dom';

import { LABELS } from '../../constants';
import config from './../../../package.json';
import { contexts } from '@oyster/common';

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
  const defaultKey = paths[current] || '1';
  const theme = 'dark';

  return (
    <div className="App">
      {/* <BasicLayout
        title={LABELS.APP_TITLE}
        footerRender={() => (
          <div className="footer" title={LABELS.FOOTER}>
            {LABELS.FOOTER}
          </div>
        )}
        navTheme={theme}
        // headerTheme={theme}
        theme={theme}
        layout="top"
        primaryColor="#d83aeb"
        logo={<div className="App-logo" />}
        // rightContentRender={() => <AppBar />}
        links={[]}
      > */}
        {props.children}
      {/* </BasicLayout> */}
    </div>
  );
});
