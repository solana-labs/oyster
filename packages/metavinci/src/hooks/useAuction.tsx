import React, { useMemo } from 'react';
import { sampleAuction } from '../views/home/sampleData';
import { useMeta } from './../contexts';

export const useAuction = (id: string) => {
  const { metadata } = useMeta();

  return sampleAuction;
}
