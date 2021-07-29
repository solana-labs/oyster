import React from 'react';
import { Typography } from 'antd';
import { shortenAddress } from '../../utils/utils';
import { Connection, PublicKey } from '@solana/web3.js';
import { useConnectionConfig } from '../../contexts';

import { getExplorerUrl } from '../../utils/explorer';

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

  const displayAddress =
    short || props.length
      ? shortenAddress(address, props.length ?? 9)
      : address;

  return (
    <a
      href={getExplorerUrl(address, endpoint, type, props.connection)}
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
