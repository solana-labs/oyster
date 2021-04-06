import { useConnectionConfig } from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';
import { debug } from 'console';
import React from 'react';
import { useEthereum } from '../../contexts';
import { ASSET_CHAIN } from '../../models/bridge/constants';
import './style.less';
import { TokenChain } from './tokenChain';

export const TokenDisplay = ({
  asset,
  chain,
  token,
  logo,
}: {
  asset?: string;
  chain?: ASSET_CHAIN;
  token?: TokenInfo;
  logo?: string;
}) => {
  return (
    <div className="token-chain-logo">
      <img className="token-logo" alt="" src={logo || token?.logoURI} />
      {chain && <TokenChain chain={chain} className={'chain-logo'} />}
    </div>
  );
};
