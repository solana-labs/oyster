import React, {  } from "react";
import { useLendingReserve } from './../../hooks';
import { useParams } from "react-router-dom";
import './style.less';

import { UserLendingCard } from './../../components/UserLendingCard';
import { ReserveStatus } from './../../components/ReserveStatus';

export const ReserveView = () => {
  const { id } = useParams<{ id: string }>();
  const lendingReserve = useLendingReserve(id);
  const reserve = lendingReserve?.info;

  if (!reserve || !lendingReserve) {
    return null;
  }

  return <div className="reserve-overview">
    <div className="reserve-overview-container">
      <ReserveStatus
        className="reserve-overview-item reserve-overview-item-left"
        reserve={reserve}
        address={lendingReserve.pubkey} />
      <UserLendingCard
        className="reserve-overview-item reserve-overview-item-right"
        reserve={reserve}
        address={lendingReserve.pubkey} />
    </div>
  </div>;
}