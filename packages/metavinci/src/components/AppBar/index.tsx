import React, { useCallback } from 'react';
import './index.less';
import { Link, useLocation } from 'react-router-dom';
import { SearchBox } from './searchBox';
import { Button, Popover } from 'antd';
import { ConnectButton, CurrentUserBadge, useWallet,Settings } from '@oyster/common';
import { SettingOutlined } from '@ant-design/icons';

const UserActions = () => {
  return <>
    <Button className="app-btn">Bids</Button>
    <Link to={`/art/create`}>
      <Button className="app-btn">Create</Button>
    </Link>
    <Link to={`/auction/create`}>
      <Button type="primary">Sell</Button>
    </Link>
  </>;
}

export const AppBar = () => {
  const location = useLocation();
  const { connected } = useWallet();

  const isRoot = location.pathname === '/';


  return (
    <>
      <div className='app-left'>
        <SearchBox />
        <Link to={`/`}>
          <Button className="app-btn">Explore</Button>
        </Link>
        <Link to={`/artists`}>
          <Button className="app-btn">Creators</Button>
        </Link>
      </div>
      <div className="app-title title">
        <h1>META</h1>
      </div>
      <div className='app-right'>
        {connected && <UserActions />}
        {connected && <CurrentUserBadge showBalance={false} iconSize={24}  />}
        {!connected && <ConnectButton type="primary" />}
      </div>
    </>
  );
};
