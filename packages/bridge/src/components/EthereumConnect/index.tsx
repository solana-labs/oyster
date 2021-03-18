import React from 'react';
import { Button } from 'antd';

import { useCorrectNetwork } from '../../hooks/useCorrectNetwork';
import metamaskIcon from '../../assets/metamask.svg';
import { shortenAddress } from '@oyster/common';
import { useEthereum } from '../../contexts';

export const EthereumConnect = () => {
  const { accounts, onConnectEthereum, connected } = useEthereum();
  const { hasCorrespondingNetworks } = useCorrectNetwork();

  return (
    <div style={{ marginRight: 8 }}>
      {connected ? (
        hasCorrespondingNetworks ? (
          <>
            <img
              alt={'metamask-icon'}
              width={20}
              height={20}
              src={metamaskIcon}
            />
            {shortenAddress(accounts[0], 4)}
          </>
        ) : (
          <Button danger type={'primary'}>
            WRONG NETWORK
          </Button>
        )
      ) : (
        <Button onClick={() => onConnectEthereum && onConnectEthereum()}>
          <img
            alt={'metamask-icon'}
            width={20}
            height={20}
            src={metamaskIcon}
          />
          Connect Metamask
        </Button>
      )}
    </div>
  );
};
