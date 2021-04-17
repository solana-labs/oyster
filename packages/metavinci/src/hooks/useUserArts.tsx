import { TokenAccount, useUserAccounts } from '@oyster/common';
import React, { useMemo } from 'react';
import { useMeta } from './../contexts';

export const useUserArts = () => {
  const { metadata } = useMeta();
  const { userAccounts } = useUserAccounts();
  const accountByMint = userAccounts.reduce((prev, acc) => {
    prev.set(acc.info.mint.toBase58(), acc);
    return prev;
  }, new Map<string, TokenAccount>());

  const ownedMetadata = metadata.filter(m => accountByMint.has(m.info.mint.toBase58()));

  return ownedMetadata;
}
