import React from 'react';

import { Identicon } from '../Identicon';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '../../contexts/wallet';
import { useNativeAccount } from '../../contexts/accounts';
import { formatNumber, shortenAddress } from '../../utils';
import './styles.css';
import { Popover } from 'antd';
import { Settings } from '../Settings';

export const CurrentUserBadge = (props: { showBalance?: boolean, iconSize?: number }) => {
  const { wallet } = useWallet();
  const { account } = useNativeAccount();

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  // should use SOL ◎ ?

  return (
    <div className="wallet-wrapper">
      {props.showBalance && <span>
        {formatNumber.format((account?.lamports || 0) / LAMPORTS_PER_SOL)} SOL
      </span>}

      <Popover
          placement="topRight"
          title="Settings"
          content={<Settings />}
          trigger="click"
            >
        <div className="wallet-key" style={{ height: props.iconSize, cursor: 'pointer', userSelect: 'none' }}>
          {shortenAddress(`${wallet.publicKey}`)}
          <Identicon
            address={wallet.publicKey?.toBase58()}
            style={{ marginLeft: '0.5rem', display: 'flex', width: props.iconSize }}
          />
        </div>
      </Popover>
    </div>
  );
};
