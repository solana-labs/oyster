import { Button, Card } from 'antd';
import React, { useState } from 'react';
import { ActionConfirmation } from '../../../components/ActionConfirmation';
import { LABELS } from '../../../constants';
import { contexts, ParsedAccount } from '@oyster/common';
import {
  LendingReserve,
  LendingReserveParser,
} from '../../../models/lending/reserve';
import { Position } from './interfaces';
import { useLeverage } from './leverage';
import CollateralInput from '../../../components/CollateralInput';
import { usePoolAndTradeInfoFrom } from './utils';
import { UserDeposit } from '../../../hooks';
import { ArrowDownOutlined } from '@ant-design/icons';

const { cache } = contexts.Accounts;
const { useWallet } = contexts.Wallet;

interface NewPositionFormProps {
  lendingReserve: ParsedAccount<LendingReserve>;
  newPosition: Position;
  setNewPosition: (pos: Position) => void;
}

export const generateActionLabel = (
  connected: boolean,
  newPosition: Position,
) => {
  return !connected
    ? LABELS.CONNECT_LABEL
    : newPosition.error
    ? newPosition.error
    : LABELS.TRADING_ADD_POSITION;
};

function onUserChangesLeverageOrCollateralValue({
  newPosition,
  setNewPosition,
  collateralDeposit,
  enrichedPools,
}: {
  newPosition: Position;
  setNewPosition: (pos: Position) => void;
  enrichedPools: any[];
  collateralDeposit: UserDeposit | undefined;
}) {
  setNewPosition(newPosition); // It has always changed, need to guarantee save
  // if user changes leverage, we need to adjust the amount they desire up.
  if (collateralDeposit && enrichedPools.length) {
    const exchangeRate =
      enrichedPools[0].liquidityB / enrichedPools[0].liquidityA;
    const convertedAmount =
      (newPosition.collateral.value || 0) * newPosition.leverage * exchangeRate;
    setNewPosition({
      ...newPosition,
      asset: { ...newPosition.asset, value: convertedAmount },
    });
  }
}

function onUserChangesAssetValue({
  newPosition,
  setNewPosition,
  collateralDeposit,
  enrichedPools,
}: {
  newPosition: Position;
  setNewPosition: (pos: Position) => void;
  enrichedPools: any[];
  collateralDeposit: UserDeposit | undefined;
}) {
  setNewPosition(newPosition); // It has always changed, need to guarantee save
  if (collateralDeposit && enrichedPools.length) {
    const exchangeRate =
      enrichedPools[0].liquidityB / enrichedPools[0].liquidityA;
    const convertedAmount =
      (newPosition.asset.value || 0) / (exchangeRate * newPosition.leverage);
    setNewPosition({
      ...newPosition,
      collateral: { ...newPosition.collateral, value: convertedAmount },
    });
  }
}

export default function NewPositionForm({
  lendingReserve,
  newPosition,
  setNewPosition,
}: NewPositionFormProps) {
  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  };
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { enrichedPools, collateralDeposit } = usePoolAndTradeInfoFrom(
    newPosition,
  );
  useLeverage({ newPosition, setNewPosition });
  const { wallet, connected } = useWallet();

  return (
    <Card
      className="new-position-item new-position-item-top-left"
      bodyStyle={bodyStyle}
    >
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            <CollateralInput
              title="Collateral"
              reserve={lendingReserve.info}
              amount={newPosition.collateral.value}
              onInputChange={(val: number | null) => {
                const newPos = {
                  ...newPosition,
                  collateral: { ...newPosition.collateral, value: val },
                };
                onUserChangesLeverageOrCollateralValue({
                  newPosition: newPos,
                  setNewPosition,
                  enrichedPools,
                  collateralDeposit,
                });
              }}
              onCollateralReserve={key => {
                const id: string =
                  cache
                    .byParser(LendingReserveParser)
                    .find(acc => acc === key) || '';
                const parser = cache.get(id) as ParsedAccount<LendingReserve>;
                const newPos = {
                  ...newPosition,
                  collateral: {
                    value: newPosition.collateral.value,
                    type: parser,
                  },
                };
                onUserChangesLeverageOrCollateralValue({
                  newPosition: newPos,
                  setNewPosition,
                  enrichedPools,
                  collateralDeposit,
                });
              }}
              showLeverageSelector={true}
              onLeverage={(leverage: number) => {
                const newPos = { ...newPosition, leverage };
                onUserChangesLeverageOrCollateralValue({
                  newPosition: newPos,
                  setNewPosition,
                  enrichedPools,
                  collateralDeposit,
                });
              }}
              leverage={newPosition.leverage}
            />
          </div>
          <ArrowDownOutlined />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'stretch',
            }}
          >
            {newPosition.asset.type && (
              <CollateralInput
                title="Choose trade"
                reserve={newPosition.asset.type.info}
                amount={newPosition.asset.value}
                onInputChange={(val: number | null) => {
                  const newPos = {
                    ...newPosition,
                    asset: { ...newPosition.asset, value: val },
                  };
                  onUserChangesAssetValue({
                    newPosition: newPos,
                    setNewPosition,
                    enrichedPools,
                    collateralDeposit,
                  });
                }}
                disabled
                hideBalance={true}
              />
            )}
            <Button
              className="trade-button"
              type="primary"
              size="large"
              onClick={connected ? null : wallet.connect}
              style={{ width: '100%' }}
              disabled={connected && !!newPosition.error}
            >
              <span>{generateActionLabel(connected, newPosition)}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
