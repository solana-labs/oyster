import React from 'react';
import { ASSET_CHAIN } from '../../models/bridge/constants';

export const TokenChain = (props: {
  chain?: ASSET_CHAIN;
  className?: string;
}) => {
  const { chain, className } = props;
  return (
    <img
      className={`chain-logo ${className}`}
      alt=""
      src={
        chain === ASSET_CHAIN.Ethereum
          ? '/blockchains/ETH.svg'
          : '/blockchains/solana.webp'
      }
    />
  );
};
