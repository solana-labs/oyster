import React from 'react';
import { contexts, utils } from '@oyster/common';

import { Identicon } from '../Identicon';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
const { useWallet } = contexts.Wallet;
const { useNativeAccount } = contexts.Accounts;
const { formatNumber, shortenAddress } = utils;

export const CurrentUserBadge = (props: {}) => {
  const { wallet } = useWallet();
  const { account } = useNativeAccount();

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  // should use SOL ◎ ?

  return (
    <div className="wallet-wrapper">
      <span>
        {formatNumber.format((account?.lamports || 0) / LAMPORTS_PER_SOL)} SOL
      </span>
      <div className="wallet-key">
        {shortenAddress(`${wallet.publicKey}`)}
        <Identicon
          address={wallet.publicKey?.toBase58()}
          style={{ marginLeft: '0.5rem', display: 'flex' }}
        />
      </div>
    </div>
  );
};
