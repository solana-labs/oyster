import { Button, Dropdown, Menu } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import React, { useCallback } from 'react';
import { useWalletModal, useWallet } from "../../contexts";

export interface ConnectButtonProps
  extends ButtonProps,
    React.RefAttributes<HTMLElement> {
  allowWalletChange?: boolean;
}

export const ConnectButton = (props: ConnectButtonProps) => {
  const { wallet, connected, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const open = useCallback(() => setVisible(true), [setVisible]);
  const { onClick, children, disabled, allowWalletChange, ...rest } = props;

  // only show if wallet selected or user connected

  if (!wallet || !allowWalletChange) {
    return (
      <Button
        {...rest}
        onClick={connected ? onClick : (wallet ? connect : open)}
        disabled={connected && disabled}
      >
        {connected ? props.children : 'Connect'}
      </Button>
    );
  }

  return (
    <Dropdown.Button
      onClick={connected ? onClick : connect}
      disabled={connected && disabled}
      overlay={
        <Menu>
          <Menu.Item onClick={open}>
            Change Wallet
          </Menu.Item>
        </Menu>
      }
    >
      Connect
    </Dropdown.Button>
  );
};
