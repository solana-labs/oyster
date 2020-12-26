import { Progress, Slider, Card, Statistic } from 'antd';
import React, { useState } from 'react';
import { Position } from './interfaces';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import tokens from '../../../config/tokens.json';
import GainsChart from './GainsChart';

export function Breakdown({ item }: { item: Position }) {
  let myPart = parseFloat(item.asset?.value || '0') / item.leverage;
  const brokeragePart = parseFloat(item.asset?.value || '0') - myPart;
  const brokerageColor = 'brown';
  const myColor = 'blue';
  const gains = 'green';
  const losses = 'red';
  const token = tokens.find((t) => t.mintAddress === item.asset.type?.info?.liquidityMint?.toBase58());

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
            suffix={token?.tokenSymbol}
          />
        </Card>
        <Card>
          <Statistic
            title='My Collateral Value'
            value={myPart}
            precision={2}
            valueStyle={{ color: myColor }}
            suffix={token?.tokenSymbol}
          />
        </Card>
        <Card>
          <Statistic
            title='Profit/Loss'
            value={profitPart}
            precision={2}
            valueStyle={{ color: profitPart > 0 ? gains : losses }}
            suffix={token?.tokenSymbol}
            prefix={profitPart > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          />
        </Card>
      </div>
      <GainsChart item={item} priceChange={myGain} />
      {progressBar}
    </div>
  );
}
