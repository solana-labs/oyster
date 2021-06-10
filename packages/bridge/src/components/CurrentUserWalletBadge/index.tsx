import React from 'react';

import { useWallet, WALLET_PROVIDERS } from '@oyster/common';
import { shortenAddress } from '@oyster/common';

export const CurrentUserWalletBadge = (props: { showDisconnect?: boolean }) => {
  const { wallet, disconnect } = useWallet();

  if (!wallet || !wallet.publicKey) {
    return null;
  }

  return (
    <div className="wallet-wrapper">
      <div className="wallet-key">
        <img
          alt={'icon'}
          width={20}
          height={20}
          src={WALLET_PROVIDERS.filter(p => p.name === 'Sollet')[0]?.icon}
          style={{ marginRight: 8 }}
        />
        {shortenAddress(`${wallet.publicKey}`)}
        {props.showDisconnect && (
          <span className={'disconnect'} onClick={() => disconnect()}>
            X
          </span>
        )}
      </div>
    </div>
  );
};
