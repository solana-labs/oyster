import React, { useState } from "react";
import "./../../App.less";
import GitHubButton from "react-github-btn";
import { Menu } from 'antd';
import {
  PieChartOutlined,
  GithubOutlined,
  BankOutlined,
  LogoutOutlined,
  HomeOutlined,
  RocketOutlined
} from '@ant-design/icons';

import BasicLayout, { DefaultFooter, PageContainer } from '@ant-design/pro-layout';
import { AppBar } from "./../AppBar";
import { Link, useLocation } from "react-router-dom";
import { useConnectionConfig } from "../../contexts/connection";

export const AppLayout = (props: any) => {
  const { env } = useConnectionConfig();
  const location = useLocation();

  console.log(location.pathname)
  const paths: { [key: string]: string } = {
    '/dashboard': '2',
    '/deposit': '3',
    '/borrow': '4',
    '/faucet': '4',

  };

  const current = [...Object.keys(paths)].find(key => location.pathname.startsWith(key)) || '';
  const defaultKey = paths[current] || "1";

  return (
    <div className="App">
      <div className="Banner">
        <div className="Banner-description">
          Oyster Lending is unaudited software. Use at your own risk.
                </div>
      </div>
      <BasicLayout title="Oyster Lending"
        navTheme="realDark"
        headerTheme="dark"
        theme="dark"
        layout="side"
        primaryColor="#d83aeb"
        logo={<div className="App-logo" />}
        rightContentRender={() => <AppBar />}
        links={[
          <div title="Fork"><GithubOutlined /></div>
        ]}
        menuContentRender={() => {
          return <Menu theme="dark" defaultSelectedKeys={[defaultKey]} mode="inline">
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <Link
                to={{
                  pathname: "/",
                }}
              >
                Home
            </Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<PieChartOutlined />} >
              <Link
                to={{
                  pathname: "/dashboard",
                }}
              >
                Dashboard
            </Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<BankOutlined />}>
              <Link
                to={{
                  pathname: "/deposit",
                }}
              >
                Deposit
            </Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<LogoutOutlined />}>
              <Link
                to={{
                  pathname: "/borrow",
                }}
              >
                Borrow
            </Link>
            </Menu.Item>
            {env !== "mainnet-beta" && <Menu.Item key="5" icon={<RocketOutlined />}>
              <Link
                to={{
                  pathname: "/faucet",
                }}
              >
                Faucet
            </Link>
            </Menu.Item>}
          </Menu>
        }}
      >
        {props.children}
      </BasicLayout>
    </div>
  );
}

