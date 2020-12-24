import { Select } from 'antd';
import React from 'react';
import { NumericInput } from '../../../components/Input/numeric';
import { TokenIcon } from '../../../components/TokenIcon';
import tokens from '../../../config/tokens.json';

const { Option } = Select;
interface EditableAssetProps {
  label: string;
  assetKey: string;
  setItem: (item: any) => void;
  item: any;
}
export default function EditableAsset({ label, assetKey, setItem, item }: EditableAssetProps) {
  if (!item[assetKey]?.type) {
    return (
      <Select
        size='large'
        showSearch
        style={{ margin: '5px 0px' }}
        placeholder={label}
        onChange={(v) =>
          setItem({ ...item, [assetKey]: { ...(item[assetKey] || {}), type: tokens.find((t) => t.mintAddress === v) } })
        }
      >
        {tokens.map((token) => (
          <Option key={token.mintAddress} value={token.mintAddress} name={token.tokenName} title={token.tokenName}>
            <div key={token.mintAddress} style={{ display: 'flex', alignItems: 'center' }}>
              <TokenIcon mintAddress={token.mintAddress} />
              {token.tokenName}
            </div>
          </Option>
        ))}
      </Select>
    );
  } else {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
        <NumericInput
          value={item[assetKey].value}
          style={{
            fontSize: 20,
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          onChange={(v: number) => {
            setItem({ ...item, [assetKey]: { ...(item[assetKey] || {}), value: v } });
          }}
          placeholder='0.00'
        />
        <TokenIcon mintAddress={item[assetKey]?.type?.mintAddress} />
      </div>
    );
  }
}
