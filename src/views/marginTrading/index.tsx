import React, { useState } from 'react';
import { LABELS } from '../../constants';
import './style.less';
import { Card, Progress, Slider, Statistic } from 'antd';
import MarginTradePosition from './MarginTradePosition';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

export interface IToken {
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface IPosition {
  id?: number | null;
  leverage: number;
  collateral?: IToken;
  asset?: {
    type: IToken;
    value: number;
  };
}

export function Breakdown({ item }: { item: IPosition }) {
  let myPart = (item.asset?.value || 0) / item.leverage;
  const brokeragePart = (item.asset?.value || 0) - myPart;
  const brokerageColor = 'brown';
  const myColor = 'blue';
  const gains = 'green';
  const losses = 'red';

  const [myGain, setMyGain] = useState<number>(0);
  const profitPart = (myPart + brokeragePart) * (myGain / 100);
  let progressBar = null;
  if (profitPart > 0) {
    // normalize...
    const total = profitPart + myPart + brokeragePart;
    progressBar = (
      <Progress
        percent={(myPart / total) * 100 + (brokeragePart / total) * 100}
        success={{ percent: (brokeragePart / total) * 100, strokeColor: brokerageColor }}
        strokeColor={myColor}
        trailColor={gains}
        showInfo={false}
      />
    );
  } else {
    // now, we're eating away your profit...
    myPart += profitPart; // profit is negative
    const total = myPart + brokeragePart;
    if (myPart < 0) {
      progressBar = <p>Your position has been liquidated at this price swing.</p>;
    } else
      progressBar = (
        <Progress
          showInfo={false}
          success={{ percent: (brokeragePart / total) * 100, strokeColor: brokerageColor }}
          trailColor={myColor}
        />
      );
  }

  return (
    <div>
      <Slider
        tooltipVisible={true}
        defaultValue={0}
        dots={true}
        max={100}
        min={-100}
        step={5}
        tooltipPlacement={'top'}
        onChange={(v: number) => {
          setMyGain(v);
        }}
        style={{ marginBottom: '20px' }}
      />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <Card>
          <Statistic
            title='Leverage'
            value={brokeragePart}
            precision={2}
            valueStyle={{ color: brokerageColor }}
            suffix={item.asset?.type.tokenName}
          />
        </Card>
        <Card>
          <Statistic
            title='My Collateral Value'
            value={myPart}
            precision={2}
            valueStyle={{ color: myColor }}
            suffix={item.asset?.type.tokenName}
          />
        </Card>
        <Card>
          <Statistic
            title='Profit/Loss'
            value={profitPart}
            precision={2}
            valueStyle={{ color: profitPart > 0 ? gains : losses }}
            suffix={item.asset?.type.tokenSymbol}
            prefix={profitPart > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          />
        </Card>
      </div>
      {progressBar}
    </div>
  );
}
export const MarginTrading = () => {
  const [newPosition, setNewPosition] = useState<IPosition>({ id: null, leverage: 1 });

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
          <Breakdown item={newPosition} />
          {positions.map((item) => (
            <MarginTradePosition key={item.id} item={item} />
          ))}
        </Card>
      </div>
    </div>
  );
};
