import { Button, Select, Slider } from 'antd';
import React from 'react';
import { NumericInput } from '../../components/Input/numeric';
import { TokenIcon } from '../../components/TokenIcon';
import tokens from '../../config/tokens.json';
import { LABELS } from '../../constants/labels';
const { Option } = Select;

interface EditableAssetProps {
  label: string;
  itemAssetKey: string;
  itemAssetValueKey: string;
  setItem: (item: any) => void;
  item: any;
}
function EditableAsset({ label, itemAssetKey, itemAssetValueKey, setItem, item }: EditableAssetProps) {
  console.log('Now looking at', item);
  if (!item[itemAssetKey]) {
    return (
      <Select
        size='large'
        showSearch
        style={{ margin: '5px 0px' }}
        placeholder={label}
        onChange={(v) => setItem({ ...item, [itemAssetKey]: tokens.find((t) => t.mintAddress === v) })}
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
          value={item[itemAssetValueKey]}
          style={{
            fontSize: 20,
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          placeholder='0.00'
        />
        <TokenIcon mintAddress={item[itemAssetKey]?.mintAddress} />
      </div>
    );
  }
}

export default function MarginTradePosition({ item, setItem }: { item: any; setItem?: (item: any) => void }) {
  return (
    <div className='trading-item'>
      <div>
        {setItem && (
          <EditableAsset
            item={item}
            setItem={setItem}
            label={LABELS.TRADING_TABLE_TITLE_MY_COLLATERAL}
            itemAssetKey={'collateralType'}
            itemAssetValueKey={'collateralValue'}
          />
        )}
      </div>
      <div>
        {setItem && (
          <EditableAsset
            item={item}
            setItem={setItem}
            label={LABELS.TRADING_TABLE_TITLE_MY_COLLATERAL}
            itemAssetKey={'assetType'}
            itemAssetValueKey={'assetValue'}
          />
        )}
      </div>
      <div>
        <Slider tooltipVisible={true} defaultValue={1} dots={true} max={5} min={1} step={1} tooltipPlacement={'top'} />
      </div>
      <div>123</div>
      <div>123</div>
      <div>123</div>
      <div>
        <Button type='primary'>
          <span>{LABELS.TRADING_ADD_POSITION}</span>
        </Button>
      </div>
    </div>
  );
}
