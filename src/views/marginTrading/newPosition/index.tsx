import React, { useState } from 'react';
import { useLendingReserve, useTokenName } from '../../../hooks';
import { useParams } from 'react-router-dom';
import './style.less';
import tokens from '../../../config/tokens.json';

import { SideReserveOverview, SideReserveOverviewMode } from '../../../components/SideReserveOverview';
import NewPositionForm from './NewPositionForm';
import { Position } from './interfaces';
import { useEffect } from 'react';

export const NewPosition = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const [newPosition, setNewPosition] = useState<Position>({
    id: null,
    leverage: 1,
    asset: { value: 0 },
  });

  const assetTokenType = tokens.find((t) => t.mintAddress === lendingReserve?.info?.liquidityMint?.toBase58());
  if (!lendingReserve) {
    return null;
  }

  if (!assetTokenType) {
    return null;
  } else {
    if (newPosition.asset.type != assetTokenType) {
      setNewPosition({ ...newPosition, asset: { value: newPosition.asset.value, type: assetTokenType } });
    }
  }

  return (
    <div className='new-position'>
      <div className='new-position-container'>
        <NewPositionForm lendingReserve={lendingReserve} newPosition={newPosition} setNewPosition={setNewPosition} />
        <SideReserveOverview
          className='new-position-item new-position-item-right'
          reserve={lendingReserve}
          mode={SideReserveOverviewMode.Borrow}
        />
      </div>
    </div>
  );
};
