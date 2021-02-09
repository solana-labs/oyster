import { Button } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import React from 'react';
import { contexts } from '@oyster/common';
import { LABELS } from './../../constants';
const { useWallet } = contexts.Wallet;

export const ConnectButton = (
  props: ButtonProps & React.RefAttributes<HTMLElement>,
) => {
  const { wallet, connected } = useWallet();
  const { onClick, children, disabled, ...rest } = props;
  return (
    <Button
      {...rest}
      onClick={connected ? onClick : wallet.connect}
      disabled={connected && disabled}
    >
      {connected ? props.children : LABELS.CONNECT_LABEL}
    </Button>
  );
};
