import React, { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useMeta } from './../contexts';

export const useArt = (id: PublicKey | string) => {
  const { accounts } = useMeta();

  const key = typeof id === 'string' ? id : (id?.toBase58() || '');
  const account = useMemo(() => accounts.find(a => a.pubkey.toBase58() === key), [key, accounts]);

  return account;
}
