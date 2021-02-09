import React from 'react';
import { Button, Popover } from 'antd';
import { contexts } from '@oyster/common';
import { CurrentUserBadge } from '../CurrentUserBadge';
import { SettingOutlined } from '@ant-design/icons';
import { Settings } from '../Settings';
import { LABELS } from '../../constants';
const { useWallet } = contexts.Wallet;

export const AppBar = (props: { left?: JSX.Element; right?: JSX.Element }) => {
  const { connected, wallet } = useWallet();

  const TopBar = (
    <div className="App-Bar-right">
      <CurrentUserBadge />
      <div>
        {!connected && (
          <Button
            type="text"
            size="large"
            onClick={connected ? wallet.disconnect : wallet.connect}
            style={{ color: '#2abdd2' }}
          >
            {LABELS.CONNECT_BUTTON}
          </Button>
        )}
        {connected && (
          <Popover
            placement="bottomRight"
            title={LABELS.WALLET_TOOLTIP}
            trigger="click"
          ></Popover>
        )}
      </div>
      <Popover
        placement="topRight"
        title={LABELS.SETTINGS_TOOLTIP}
        content={<Settings />}
        trigger="click"
      >
        <Button
          shape="circle"
          size="large"
          type="text"
          icon={<SettingOutlined />}
        />
      </Popover>
      {props.right}
    </div>
  );

  return TopBar;
};
