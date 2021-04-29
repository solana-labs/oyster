import React, { useEffect, useMemo, useState } from 'react';
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

export const useArt = (id?: PublicKey | string) => {
  const { metadata } = useMeta();

  const key = typeof id === 'string' ? id : id?.toBase58() || '';
  const account = useMemo(
    () => metadata.find(a => a.pubkey.toBase58() === key),
    [key, metadata],
  );

  const [art, setArt] = useState(metadataToArt(account?.info));

  useEffect(() => {
    if (account && account.info.uri) {
      fetch(account.info.uri, { cache: 'force-cache' })
        .then(async _ => {
          try {
            account.info.extended = await _.json();
            if (
              !account.info.extended ||
              account.info.extended?.files?.length === 0
            ) {
              return;
            }

            if (account.info.extended?.image) {
              const file = `${account.info.uri}/${account.info.extended.image}`;
              account.info.extended.image = file;
              await fetch(file, { cache: 'force-cache' })
                .then(res => res.blob())
                .then(
                  blob =>
                    account.info.extended &&
                    (account.info.extended.image = URL.createObjectURL(blob)),
                );

              setArt(metadataToArt(account?.info));
            }
          } catch {
            return undefined;
          }
        })
        .catch(() => {
          return undefined;
        });
    }
  }, [account, setArt, metadata]);

  return art;
};
