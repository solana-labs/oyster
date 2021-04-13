import React, { useMemo } from 'react';
import { useMeta } from './../contexts';

export enum AuctionState {
  Live = '0',
  Upcoming = '1',
  Ended = '2',
  BuyNow = '3',
}

export const useAuctions = (state: AuctionState) => {
  const { metadata } = useMeta();

  return metadata;
}
