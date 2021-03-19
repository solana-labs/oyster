import React from 'react';
import { Button, Dropdown, Menu } from 'antd';

import { useCorrectNetwork } from '../../hooks/useCorrectNetwork';
import { shortenAddress } from '@oyster/common';
import { useEthereum } from '../../contexts';

export const EthereumConnect = () => {
  const {
    accounts,
    onConnectEthereum,
    connected,
    walletProvider,
    select,
  } = useEthereum();
  const { hasCorrespondingNetworks } = useCorrectNetwork();

  const menu = (
    <Menu>
      <Menu.Item key="3" onClick={select}>
        Change Eth Wallet
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ marginRight: 8 }}>
      {connected ? (
        hasCorrespondingNetworks ? (
          <>
            <img
              alt={'ethereum-icon'}
              width={20}
              height={20}
              style={{ marginRight: 5 }}
              src={walletProvider.icon}
            />
            {shortenAddress(accounts[0], 4)}
          </>
        ) : (
          <Button danger type={'primary'}>
            WRONG NETWORK
          </Button>
        )
      ) : !!walletProvider ? (
        <Dropdown.Button
          onClick={() => onConnectEthereum && onConnectEthereum()}
          overlay={menu}
        >
          Connect Ethereum
        </Dropdown.Button>
      ) : (
        <Button onClick={() => onConnectEthereum && onConnectEthereum()}>
          Connect Ethereum
        </Button>
      )}
    </div>
  );
};
