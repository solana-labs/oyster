import React, { useState } from 'react';
import { LABELS } from '../../constants';
import './style.less';
import { Card } from 'antd';
import MarginTradePosition from './MarginTradePosition';

export const MarginTrading = () => {
  const [newPosition, setNewPosition] = useState<any>({ id: null });

  const positions: any[] = [];
  return (
    <div className='trading-container'>
      <div className='flexColumn'>
        <Card>
          <div className='trading-item trading-header'>
            <div>{LABELS.TRADING_TABLE_TITLE_MY_COLLATERAL}</div>
            <div>{LABELS.TRADING_TABLE_TITLE_DESIRED_ASSET}</div>
            <div>{LABELS.TRADING_TABLE_TITLE_MULTIPLIER}</div>
            <div>{LABELS.TRADING_TABLE_TITLE_ASSET_PRICE}</div>
            <div>{LABELS.TRADING_TABLE_TITLE_LIQUIDATION_PRICE}</div>
            <div>{LABELS.TRADING_TABLE_TITLE_APY}</div>
            <div>{LABELS.TRADING_TABLE_TITLE_ACTIONS}</div>
          </div>
          <MarginTradePosition key={newPosition.id} item={newPosition} setItem={setNewPosition} />
          {positions.map((item) => (
            <MarginTradePosition key={item.id} item={item} />
          ))}
        </Card>
      </div>
    </div>
  );
};
