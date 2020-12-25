import { Button, Card, Radio } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { ActionConfirmation } from '../../../components/ActionConfirmation';
import { NumericInput } from '../../../components/Input/numeric';
import { TokenIcon } from '../../../components/TokenIcon';
import { LABELS } from '../../../constants';
import { cache, ParsedAccount } from '../../../contexts/accounts';
import { collateralToLiquidity, LendingReserve, LendingReserveParser } from '../../../models/lending/reserve';
import { Position } from './interfaces';
import tokens from '../../../config/tokens.json';
import { CollateralSelector } from '../../../components/CollateralSelector';
import { Breakdown } from './Breakdown';
import { usePoolForBasket } from '../../../utils/pools';
import { useEnrichedPools } from '../../../contexts/market';

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

  const collType = newPosition.collateral;
  const desiredType = newPosition.asset.type;

  const pool = usePoolForBasket([
    collType?.info?.liquidityMint?.toBase58(),
    desiredType?.info?.liquidityMint?.toBase58(),
  ]);

  const enriched = useEnrichedPools(pool ? [pool] : []);

  // Leverage validation - if you choose this leverage, is it allowable, with your buying power and with
  // the pool we have to cover you?
  useEffect(() => {
    if (!collType || !desiredType || !newPosition.asset.value || !enriched || enriched.length == 0) {
      return;
    }

    const amountDesiredToPurchase = newPosition.asset.value;
    const leverageDesired = newPosition.leverage;
    console.log('collateral reserve', collType);
    const amountAvailableInOysterForMargin = collateralToLiquidity(collType.info.availableLiquidity, desiredType.info);
    const amountToDepositOnMargin = amountDesiredToPurchase / leverageDesired;
    console.log(
      'Amount desired',
      amountDesiredToPurchase,
      'leverage',
      leverageDesired,
      'amountAvailable',
      amountAvailableInOysterForMargin,
      ' amount to deposit on margin',
      amountToDepositOnMargin
    );
    if (amountToDepositOnMargin > amountAvailableInOysterForMargin) {
      setNewPosition({ ...newPosition, error: LABELS.NOT_ENOUGH_MARGIN_MESSAGE });
      return;
    }

    const liqA = enriched[0].liquidityA;
    const liqB = enriched[0].liquidityB;
    const supplyRatio = liqA / liqB;

    console.log('Liq A', liqA, 'liq b', liqB, 'supply ratio', supplyRatio);

    // change in liquidity is amount desired (in units of B) converted to collateral units(A)
    const chgLiqA = collateralToLiquidity(amountDesiredToPurchase, collType.info);
    const newLiqA = liqA - chgLiqA;
    const newLiqB = liqB + amountDesiredToPurchase;
    const newSupplyRatio = newLiqA / newLiqB; // 75 / 100
    console.log('chg in liq a', chgLiqA, 'new liq a', newLiqA, 'new supply ratio', newSupplyRatio);
    const priceImpact = Math.abs(100 - 100 * (newSupplyRatio / supplyRatio)); // abs(100 - 100*(0.75 / 1)) = 25%
    const marginToLeverage = 100 / leverageDesired;
    console.log('priceImpact', priceImpact, 'marginToLeverage', marginToLeverage);
    if (marginToLeverage > priceImpact) {
      // if their marginToLeverage ratio < priceImpact, we say hey ho no go
      setNewPosition({ ...newPosition, error: LABELS.LEVERAGE_LIMIT_MESSAGE });
      return;
    }
  }, [collType, desiredType, newPosition.asset.value, newPosition.leverage, enriched]);

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
              onChange={(v: number) => {
                setNewPosition({ ...newPosition, asset: { ...newPosition.asset, value: v } });
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
