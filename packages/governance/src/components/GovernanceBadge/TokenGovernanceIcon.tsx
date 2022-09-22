import React from 'react';
import { TokenIcon, useAccount, useConnectionConfig } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';

const TokenGovernanceIcon = ({ governedAccount, size }: { governedAccount: PublicKey, size: number }) => {
  const { tokenMap } = useConnectionConfig();
  const tokenAccount = useAccount(governedAccount);
  const tokenMint = tokenAccount?.info?.mint;

  return <div style={{ position: 'relative' }} className='token-icon-container'>
    <TokenIcon
      style={{ position: 'absolute', left: size * 0.5 }}
      mintAddress={tokenMint}
      tokenMap={tokenMap}
      size={size * 0.6}
    />
    <TokenIcon mintAddress={tokenMint} tokenMap={tokenMap} size={size * 0.6}/>
    <TokenIcon
      style={{ position: 'absolute', left: size * 0.25, top: size * 0.3 }}
      mintAddress={tokenMint}
      tokenMap={tokenMap}
      size={size * 0.6}
    />
  </div>;
};

export default TokenGovernanceIcon;
