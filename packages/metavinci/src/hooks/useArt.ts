import React, { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useMeta } from '../contexts';
import { Art } from '../types';
import { Metadata } from '@oyster/common';

export const metadataToArt = (info: Metadata | undefined) => {
  return {
    image: info?.extended?.image,
    category: info?.extended?.category,
    title: info?.name,
    about: info?.extended?.description,
    royalties: info?.extended?.royalty,
  } as Art;
};

export const useArt = (id: PublicKey | string) => {
  const { metadata } = useMeta();

  const key = typeof id === 'string' ? id : id?.toBase58() || '';
  const account = useMemo(
    () => metadata.find(a => a.pubkey.toBase58() === key),
    [key, metadata],
  );

  return metadataToArt(account?.info);
};
