import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLendingReserve } from '../../../hooks';
import Breakdown from './Breakdown';
import { Position } from './interfaces';

import NewPositionForm from './NewPositionForm';
import PoolHealth from './PoolHealth';
import './style.less';

export const NewPosition = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const [newPosition, setNewPosition] = useState<Position>({
    id: null,
    leverage: 5,
    collateral: {},
    asset: {},
  });

  if (!lendingReserve) {
    return null;
  }

  if (!newPosition.asset.type) {
    setNewPosition({
      ...newPosition,
      asset: { value: newPosition.asset.value, type: lendingReserve },
    });
  }

  return (
    <div className="new-position">
      <div className="new-position-container">
        <div className="new-position-item-left">
          <NewPositionForm
            lendingReserve={lendingReserve}
            newPosition={newPosition}
            setNewPosition={setNewPosition}
          />
          <PoolHealth newPosition={newPosition} />
        </div>
        <Breakdown item={newPosition} />
      </div>
    </div>
  );
};
