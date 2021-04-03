import React, { useCallback } from 'react';
import './index.less';
import { Link, useLocation } from 'react-router-dom';
import { SearchBox } from './searchBox';
import { Button, Menu } from 'antd';
import { ConnectButton, CurrentUserBadge, useWallet } from '@oyster/common';

const UserActions = () => {
  return <>
    <Button className="app-btn">Bids</Button>
    <Button className="app-btn">Create</Button>
    <Button type="primary">Sell</Button>
  </>;
}

export const AppBar = () => {
  const location = useLocation();
  const { connected } = useWallet();


  return (
    <>
      <div className='app-left'>
        <SearchBox />
        <Button className="app-btn">Explore</Button>
        <Button className="app-btn">Creators</Button>
      </div>
      <div className="app-title">
        <h1>META</h1>
      </div>
      <div className='app-right'>
        {connected && <CurrentUserBadge showBalance={false}  />}
        <ConnectButton type="primary" />
        {connected && <UserActions />}
      </div>
    </>
  );
};
