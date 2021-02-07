import React from 'react';
import { Select } from 'antd';
import { ENDPOINTS, useConnectionConfig } from '@packages/common/contexts/connection';
import { useWallet, WALLET_PROVIDERS } from '@packages/common/contexts/wallet';

export const Settings = () => {
  const { providerUrl, setProvider } = useWallet();
  const { endpoint, setEndpoint } = useConnectionConfig();

  return (
    <>
      <div style={{ display: 'grid' }}>
        Network:{' '}
        <Select onSelect={setEndpoint} value={endpoint} style={{ marginRight: 8 }}>
          {ENDPOINTS.map(({ name, endpoint }) => (
            <Select.Option value={endpoint} key={endpoint}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <div style={{ display: 'grid' }}>
        Wallet:{' '}
        <Select onSelect={setProvider} value={providerUrl}>
          {WALLET_PROVIDERS.map(({ name, url }) => (
            <Select.Option value={url} key={url}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </div>
    </>
  );
};
