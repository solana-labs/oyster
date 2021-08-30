import { useConnectionConfig } from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';
import { debug } from 'console';
import React from 'react';
import { useEthereum } from '../../contexts';
import { ASSET_CHAIN, RIN_SOLANA_MINT } from '../../utils/assets';
import './style.less';
import { TokenChain } from './tokenChain';
import RinLogo from '../../assets/rinLogo.svg';

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
  const isRinToken = token?.address === RIN_SOLANA_MINT;
  return (
    <div className="token-chain-logo">
      <img
        className="token-logo"
        alt=""
        src={isRinToken ? RinLogo : logo || token?.logoURI}
      />
      {chain && <TokenChain chain={chain} className={'chain-logo'} />}
    </div>
  );
};
