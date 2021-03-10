import React, { useState } from 'react';
import { NumericInput } from '@oyster/common';
import { Card } from 'antd';
import './style.less';
import { ASSET_CHAIN } from '../../models/bridge/constants';
import { TokenSelectModal } from '../TokenSelectModal';

export function Input(props: {
  title: string;
  balance?: number;
  asset?: string;
  chain?: ASSET_CHAIN;
  setAsset: (asset: string) => void;
  amount?: number | null;
  onInputChange: (value: number | undefined) => void;
}) {
  const [lastAmount, setLastAmount] = useState<string>('');

  return (
    <Card
      className="ccy-input from-input"
      style={{ borderRadius: 20 }}
      bodyStyle={{ padding: 0 }}
    >
      <div className="ccy-input-header">
        <div className="ccy-input-header-left">{props.title}</div>

        {!!props.balance && (
          <div
            className="ccy-input-header-right"
            onClick={() =>
              props.onInputChange && props.onInputChange(props.balance)
            }
          >
            Balance: {props.balance.toFixed(6)}
          </div>
        )}
      </div>
      <div
        className="ccy-input-header"
        style={{ padding: '0px 10px 5px 7px', height: 80 }}
      >
        <NumericInput
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
            fontSize: 24,
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          placeholder="0.00"
        />
        <div className="ccy-input-header-right" style={{ display: 'flex' }}>
          <TokenSelectModal
            onSelectToken={token => props.setAsset(token)}
            asset={props.asset}
            chain={props.chain}
          />
        </div>
      </div>
    </Card>
  );
}
