import React, { useMemo } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNativeAccount } from '../../contexts/accounts';
import { formatNumber } from '../../utils';
import './styles.css';
import { Popover } from 'antd';
import { Settings } from '../Settings';

export const CurrentUserBadge = (props: {
  showBalance?: boolean;
  showAddress?: boolean;
  iconSize?: number;
}) => {
  const { wallet, publicKey } = useWallet();
  const { account } = useNativeAccount();

  const address = useMemo(() => {
    if (publicKey) {
      const base58 = publicKey.toBase58();
      return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
    }
  }, [publicKey])

  if (!wallet || !address) {
    return null;
  }

  const iconStyle: React.CSSProperties = props.showAddress
    ? {
        marginLeft: '0.5rem',
        display: 'flex',
        width: props.iconSize || 20,
        borderRadius: 50,
      }
    : {
        display: 'flex',
        width: props.iconSize || 20,
        paddingLeft: 0,
        borderRadius: 50,
      };

  const baseWalletKey: React.CSSProperties = {
    height: props.iconSize,
    cursor: 'pointer',
    userSelect: 'none',
  };
  const walletKeyStyle: React.CSSProperties = props.showAddress
    ? baseWalletKey
    : { ...baseWalletKey, paddingLeft: 0 };


  return (
    <div className="wallet-wrapper">
      {props.showBalance && (
        <span>
          {formatNumber.format((account?.lamports || 0) / LAMPORTS_PER_SOL)} SOL
        </span>
      )}

      <Popover
        placement="topRight"
        title="Settings"
        content={<Settings />}
        trigger="click"
      >
        <div className="wallet-key" style={walletKeyStyle}>
          <span style={{ marginRight: '0.5rem' }}>{address}</span>
          <img src={wallet.icon} style={iconStyle} />
        </div>
      </Popover>
    </div>
  );
};
