import React from 'react';
import { useParams } from 'react-router-dom';
import { DepositInfoLine } from '../../components/DepositInfoLine';
import {
  SideReserveOverview,
  SideReserveOverviewMode,
} from '../../components/SideReserveOverview';

import { WithdrawInput } from '../../components/WithdrawInput';
import { useLendingReserve } from '../../hooks';
import './style.less';

export const WithdrawView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return (
    <div className="deposit-reserve">
      <DepositInfoLine
        className="deposit-reserve-item"
        reserve={reserve}
        address={lendingReserve.pubkey}
      />
      <div className="deposit-reserve-container">
        <WithdrawInput
          className="deposit-reserve-item deposit-reserve-item-left"
          reserve={reserve}
          address={lendingReserve.pubkey}
        />
        <SideReserveOverview
          className="deposit-reserve-item deposit-reserve-item-right"
          reserve={lendingReserve}
          mode={SideReserveOverviewMode.Deposit}
        />
      </div>
    </div>
  );
};
