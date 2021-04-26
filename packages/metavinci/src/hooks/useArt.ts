import React, { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useMeta } from '../contexts';
import { Art } from '../types';

export const useArt = (id: PublicKey | string) => {
  const { metadata } = useMeta();

  const key = typeof id === 'string' ? id : id?.toBase58() || '';
  const account = useMemo(
    () => metadata.find(a => a.pubkey.toBase58() === key),
    [key, metadata],
  );

  return {
    image: account?.info.extended?.image,
    category: account?.info.extended?.category,
    title: account?.info.name,
    about: account?.info.extended?.description,
    royalties: account?.info.extended?.royalty,
  } as Art;
};
