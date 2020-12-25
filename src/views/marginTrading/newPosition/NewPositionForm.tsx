import { Button, Card, Radio } from 'antd';
import React, { useState } from 'react';
import { ActionConfirmation } from '../../../components/ActionConfirmation';
import { NumericInput } from '../../../components/Input/numeric';
import { TokenIcon } from '../../../components/TokenIcon';
import { LABELS } from '../../../constants';
import { cache, ParsedAccount } from '../../../contexts/accounts';
import { LendingReserve, LendingReserveParser } from '../../../models/lending/reserve';
import { Position } from './interfaces';
import tokens from '../../../config/tokens.json';
import { CollateralSelector } from '../../../components/CollateralSelector';
import { Breakdown } from './Breakdown';
import { useLeverage } from './leverage';

interface NewPositionFormProps {
  lendingReserve: ParsedAccount<LendingReserve>;
  newPosition: Position;
  setNewPosition: (pos: Position) => void;
}

export default function NewPositionForm({ lendingReserve, newPosition, setNewPosition }: NewPositionFormProps) {
  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  };
  const [showConfirmation, setShowConfirmation] = useState(false);

  useLeverage({ newPosition, setNewPosition });

  return (
    <Card className='new-position-item new-position-item-left' bodyStyle={bodyStyle}>
      {showConfirmation ? (
        <ActionConfirmation onClose={() => setShowConfirmation(false)} />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          <div className='borrow-input-title'>{LABELS.SELECT_COLLATERAL}</div>
          <CollateralSelector
            reserve={lendingReserve.info}
            onCollateralReserve={(key) => {
              const id: string = cache.byParser(LendingReserveParser).find((acc) => acc === key) || '';
              const parser = cache.get(id) as ParsedAccount<LendingReserve>;
              setNewPosition({ ...newPosition, collateral: parser });
            }}
          />

          <div className='borrow-input-title'>{LABELS.MARGIN_TRADE_QUESTION}</div>
          <div className='token-input'>
            <TokenIcon mintAddress={newPosition.asset.type?.info?.liquidityMint?.toBase58()} />
            <NumericInput
              value={newPosition.asset.value}
              style={{
                fontSize: 20,
                boxShadow: 'none',
                borderColor: 'transparent',
                outline: 'transparent',
              }}
              onChange={(v: string) => {
                setNewPosition({
                  ...newPosition,
                  asset: { ...newPosition.asset, value: v },
                });
              }}
              placeholder='0.00'
            />
            <div>
              {
                tokens.find((t) => t.mintAddress === newPosition.asset.type?.info?.liquidityMint?.toBase58())
                  ?.tokenSymbol
              }
            </div>
          </div>

          <div>
            <Radio.Group
              defaultValue={newPosition.leverage}
              size='large'
              onChange={(e) => {
                setNewPosition({ ...newPosition, leverage: e.target.value });
              }}
            >
              <Radio.Button value={1}>1x</Radio.Button>
              <Radio.Button value={2}>2x</Radio.Button>
              <Radio.Button value={3}>3x</Radio.Button>
              <Radio.Button value={4}>4x</Radio.Button>
              <Radio.Button value={5}>5x</Radio.Button>
            </Radio.Group>
            <NumericInput
              value={newPosition.leverage}
              style={{
                fontSize: 20,
                boxShadow: 'none',
                borderColor: 'transparent',
                outline: 'transparent',
              }}
              onChange={(leverage: number) => {
                setNewPosition({ ...newPosition, leverage });
              }}
            />
            <p>{newPosition.error}</p>
          </div>
          <div>
            <Button type='primary'>
              <span>{LABELS.TRADING_ADD_POSITION}</span>
            </Button>
          </div>
          <Breakdown item={newPosition} />
        </div>
      )}
    </Card>
  );
}
