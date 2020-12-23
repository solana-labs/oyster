import { Button, Select, Slider } from 'antd';
import React from 'react';
import { IPosition } from '.';
import { NumericInput } from '../../components/Input/numeric';
import { TokenIcon } from '../../components/TokenIcon';
import tokens from '../../config/tokens.json';
import { LABELS } from '../../constants/labels';
const { Option } = Select;

interface IEditableAssetProps {
  label: string;
  assetKey: string;
  setItem: (item: any) => void;
  item: any;
}
function EditableAsset({ label, assetKey, setItem, item }: IEditableAssetProps) {
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

export default function MarginTradePosition({ item, setItem }: { item: IPosition; setItem?: (item: any) => void }) {
  return (
    <div className='trading-item'>
      <div>
        {setItem && (
          <Select
            size='large'
            showSearch
            style={{ margin: '5px 0px' }}
            placeholder={LABELS.TRADING_TABLE_TITLE_MY_COLLATERAL}
            onChange={(v) => setItem({ ...item, collateral: tokens.find((t) => t.mintAddress === v) })}
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
        )}
      </div>
      <div>
        {setItem && (
          <EditableAsset
            item={item}
            setItem={setItem}
            label={LABELS.TRADING_TABLE_TITLE_DESIRED_ASSET}
            assetKey={'asset'}
          />
        )}
      </div>
      <div>
        {setItem && (
          <Slider
            tooltipVisible={true}
            defaultValue={1}
            dots={true}
            max={5}
            min={1}
            step={1}
            tooltipPlacement={'top'}
            onChange={(v: number) => {
              setItem({ ...item, leverage: v });
            }}
          />
        )}
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
