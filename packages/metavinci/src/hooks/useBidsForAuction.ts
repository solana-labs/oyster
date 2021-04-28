import React, { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import {
  AuctionData,
  BidderMetadata,
  BidderMetadataParser,
  cache,
  ParsedAccount,
} from '@oyster/common';

export const useBidsForAuction = (auctionPubkey: PublicKey | string) => {
  const id = useMemo(
    () =>
      typeof auctionPubkey === 'string'
        ? auctionPubkey
        : auctionPubkey.toBase58(),
    [auctionPubkey],
  );

  const auction = cache.get(auctionPubkey) as ParsedAccount<AuctionData>;

  const bids = cache
    .byParser(BidderMetadataParser)
    .filter(id => {
      const bidder = cache.get(id) as ParsedAccount<BidderMetadata>;
      if (!bidder) {
        return false;
      }

      return bidder.info.auctionPubkey.toBase58() === id;
    })
    .map(id => {
      const bidder = cache.get(id) as ParsedAccount<BidderMetadata>;
      return bidder;
    })
    .sort((a, b) => a.info.lastBid.sub(a.info.lastBid).toNumber())
    .map(item => {
      return {
        ...item,
      };
    });

  return bids;
};
