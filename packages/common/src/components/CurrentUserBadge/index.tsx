import React from 'react';

import { Identicon } from '../Identicon';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '../../contexts/wallet';
import { useNativeAccount } from '../../contexts/accounts';
import { formatNumber, shortenAddress } from '../../utils';
import './styles.css';
import { Popover } from 'antd';
import { Settings } from '../Settings';

export const CurrentUserBadge = (props: { showBalance?: boolean, showAddress?: boolean, iconSize?: number }) => {
  const { wallet } = useWallet();
  const { account } = useNativeAccount();

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  // should use SOL ◎ ?

  const iconStyle: React.CSSProperties = props.showAddress ?
  {
    marginLeft: '0.5rem',
    display: 'flex',
    width: props.iconSize
  } :{
    display: 'flex',
    width: props.iconSize,
    paddingLeft: 0,
  };

  const baseWalletKey: React.CSSProperties = { height: props.iconSize, cursor: 'pointer', userSelect: 'none' };
  const walletKeyStyle: React.CSSProperties = props.showAddress ?
  baseWalletKey
  :{ ...baseWalletKey, paddingLeft: 0 };

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
        <div className="wallet-key" style={walletKeyStyle}>
          {props.showAddress && shortenAddress(`${wallet.publicKey}`)}
          <Identicon
            address={wallet.publicKey?.toBase58()}
            style={iconStyle}
          />
        </div>
      </Popover>
    </div>
  );
};
