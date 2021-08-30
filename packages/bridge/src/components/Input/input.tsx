import React, { useEffect, useState } from 'react';
import {
  ConnectButton,
  CurrentUserBadge,
  NumericInput,
  useMint,
  useUserAccounts,
  useWallet,
} from '@oyster/common';
import './style.less';
import { TokenSelectModal } from '../TokenSelectModal';
import { ASSET_CHAIN, chainToName } from '../../utils/assets';
import { TokenChain } from '../TokenDisplay/tokenChain';
import { EthereumConnect } from '../EthereumConnect';
import { CurrentUserWalletBadge } from '../CurrentUserWalletBadge';

export function Input(props: {
  title: string;
  balance?: number;
  asset?: string;
  chain?: ASSET_CHAIN;
  setAsset: (asset: string) => void;
  amount?: number | null;
  onChain: (chain: ASSET_CHAIN) => void;
  onInputChange: (value: number | undefined) => void;
  className?: string;
}) {
  const { connected } = useWallet();
  const [lastAmount, setLastAmount] = useState<string>('');

  return (
    <div className={`dashed-input-container ${props.className}`}>
      <div className="input-header">{props.title}</div>
      <div className="input-chain">
        <TokenChain chain={props.chain} className={'input-icon'} />
        {chainToName(props.chain)}
        <div
          className="balance"
          onClick={() =>
            props.onInputChange && props.onInputChange(props.balance)
          }
        >
          {props.balance?.toFixed(6)}
        </div>
      </div>
      <div className="input-container">
        <NumericInput
          className={'input'}
          value={
            parseFloat(lastAmount || '0.00') === props.amount
              ? lastAmount
              : props.amount?.toFixed(6)?.toString()
          }
          onChange={(val: string) => {
            if (props.onInputChange && parseFloat(val) !== props.amount) {
              if (!val || !parseFloat(val)) props.onInputChange(undefined);
              else props.onInputChange(parseFloat(val));
            }
            setLastAmount(val);
          }}
          style={{
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          placeholder="0.00"
        />
        <div className="input-select">
          <TokenSelectModal
            onSelectToken={token => props.setAsset(token)}
            // onChain={(chain: ASSET_CHAIN) => props.onChain(chain)}
            onChain={() => {}}
            asset={props.asset}
            chain={props.chain}
            showIconChain={false}
          />
        </div>
      </div>
      {props.chain === ASSET_CHAIN.Ethereum ? (
        <EthereumConnect />
      ) : connected ? (
        <CurrentUserWalletBadge showDisconnect={true} />
      ) : (
        <ConnectButton type="text" size="large" allowWalletChange={true} />
      )}
    </div>
  );
}
