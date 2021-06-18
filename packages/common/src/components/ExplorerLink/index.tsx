import React from 'react';
import { Typography } from 'antd';
import { shortenAddress } from '../../utils/utils';
import { Connection, PublicKey } from '@solana/web3.js';
import { ENDPOINTS, useConnectionConfig } from '../../contexts';

import { ENV as ChainId } from '@solana/spl-token-registry';

export const ExplorerLink = (props: {
  address: string | PublicKey;
  type: string;
  code?: boolean;
  style?: React.CSSProperties;
  length?: number;
  short?: boolean;
  connection?: Connection;
}) => {
  const { type, code, short } = props;
  let { endpoint } = useConnectionConfig();

  const address =
    typeof props.address === 'string'
      ? props.address
      : props.address?.toBase58();

  if (!address) {
    return null;
  }

  const displayAddress = short
    ? shortenAddress(address, props.length ?? 9)
    : address;

  const getClusterUrlParam = () => {
    // If ExplorerLink is used outside of ConnectionContext, ex. in notifications, then useConnectionConfig() won't return the current endpoint
    // It would instead return the default ENDPOINT  which is not that useful to us
    // If connection is provided then we can use it instead of the hook to resolve the endpoint
    if (props.connection) {
      // Endpoint is stored as internal _rpcEndpoint prop
      endpoint = (props.connection as any)._rpcEndpoint ?? endpoint;
    }

    const env = ENDPOINTS.find(end => end.endpoint === endpoint);

    let cluster;

    if (env?.ChainId == ChainId.Testnet) {
      cluster = 'testnet';
    } else if (env?.ChainId == ChainId.Devnet) {
      if (env?.name === 'localnet') {
        cluster = `custom&customUrl=${encodeURIComponent(
          'http://127.0.0.1:8899',
        )}`;
      } else {
        cluster = 'devnet';
      }
    }

    return cluster ? `?cluster=${cluster}` : '';
  };

  return (
    <a
      href={`https://explorer.solana.com/${type}/${address}${getClusterUrlParam()}`}
      // eslint-disable-next-line react/jsx-no-target-blank
      target="_blank"
      title={address}
      style={props.style}
    >
      {code ? (
        <Typography.Text style={props.style} code>
          {displayAddress}
        </Typography.Text>
      ) : (
        displayAddress
      )}
    </a>
  );
};
