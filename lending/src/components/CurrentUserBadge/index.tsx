import React from 'react';
import { useWallet } from '@packages/common/contexts/wallet';
import { formatNumber, shortenAddress } from '@packages/common/utils/utils';
import { Identicon } from '../Identicon';
import { useNativeAccount } from '@packages/common/contexts/accounts';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const CurrentUserBadge = (props: {}) => {
  const { wallet } = useWallet();
  const { account } = useNativeAccount();

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  // should use SOL ◎ ?

  return (
    <div className='wallet-wrapper'>
      <span>{formatNumber.format((account?.lamports || 0) / LAMPORTS_PER_SOL)} SOL</span>
      <div className='wallet-key'>
        {shortenAddress(`${wallet.publicKey}`)}
        <Identicon address={wallet.publicKey?.toBase58()} style={{ marginLeft: '0.5rem', display: 'flex' }} />
      </div>
    </div>
  );
};
