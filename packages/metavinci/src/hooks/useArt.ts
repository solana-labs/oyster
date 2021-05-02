import React, { useEffect, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useMeta } from '../contexts';
import { Art, ArtType } from '../types';
import {
  Edition,
  MasterEdition,
  Metadata,
  ParsedAccount,
} from '@oyster/common';

export const metadataToArt = (
  info: Metadata | undefined,
  editions: Record<string, ParsedAccount<Edition>>,
  masterEditions: Record<string, ParsedAccount<MasterEdition>>,
) => {
  let type: ArtType = ArtType.NFT;
  let editionNumber: number | undefined = undefined;
  let maxSupply: number | undefined = undefined;
  let supply: number | undefined = undefined;

  if (info) {
    const masterEdition = masterEditions[info.masterEdition?.toBase58() || ''];
    const edition = editions[info.edition?.toBase58() || ''];
    if (edition) {
      const myMasterEdition =
        masterEditions[edition.info.parent.toBase58() || ''];
      if (myMasterEdition) {
        type =
          myMasterEdition.info.maxSupply != null &&
          myMasterEdition.info.maxSupply != undefined
            ? ArtType.LimitedEditionPrint
            : ArtType.OpenEditionPrint;
        if (type == ArtType.LimitedEditionPrint)
          editionNumber = edition.info.edition.toNumber();
      }
    } else if (masterEdition) {
      type =
        masterEdition.info.maxSupply != null &&
        masterEdition.info.maxSupply != undefined
          ? ArtType.LimitedMasterEdition
          : ArtType.OpenMasterEdition;
      if (type == ArtType.LimitedMasterEdition) {
        maxSupply = masterEdition.info.maxSupply?.toNumber();
        supply = masterEdition.info.supply.toNumber();
      }
    }
  }
  return {
    image: info?.extended?.image,
    category: info?.extended?.category,
    title: info?.name,
    about: info?.extended?.description,
    royalties: info?.extended?.royalty,
    edition: editionNumber,
    maxSupply,
    supply,
    type,
  } as Art;
};

export const useArt = (id?: PublicKey | string) => {
  const { metadata, editions, masterEditions } = useMeta();

  const key = typeof id === 'string' ? id : id?.toBase58() || '';
  const account = useMemo(
    () => metadata.find(a => a.pubkey.toBase58() === key),
    [key, metadata],
  );

  const [art, setArt] = useState(
    metadataToArt(account?.info, editions, masterEditions),
  );

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

              setArt(metadataToArt(account?.info, editions, masterEditions));
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
