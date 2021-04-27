import { TokenAccount, useConnection, useUserAccounts } from '@oyster/common';
import { useEffect, useState } from 'react';
import { AuctionView, processAccountsIntoAuctionView } from '.';
import { useMeta } from '../contexts';

export const useAuction = (id: string) => {
  const connection = useConnection();
  const { userAccounts } = useUserAccounts();
  const accountByMint = userAccounts.reduce((prev, acc) => {
    prev.set(acc.info.mint.toBase58(), acc);
    return prev;
  }, new Map<string, TokenAccount>());
  const [clock, setClock] = useState<number>(0);
  const [existingAuctionView, setAuctionView] = useState<AuctionView | null>(
    null,
  );
  useEffect(() => {
    connection.getSlot().then(setClock);
  }, [connection]);

  const {
    auctions,
    auctionManagers,
    safetyDepositBoxesByVaultAndIndex,
    metadataByMint,
    bidderMetadataByAuctionAndBidder,
    bidderPotsByAuctionAndBidder,
  } = useMeta();

  useEffect(() => {
    const auction = auctions[id];
    if (auction) {
      console.log(bidderMetadataByAuctionAndBidder);
      const auctionView = processAccountsIntoAuctionView(
        auction,
        auctionManagers,
        safetyDepositBoxesByVaultAndIndex,
        metadataByMint,
        bidderMetadataByAuctionAndBidder,
        bidderPotsByAuctionAndBidder,
        accountByMint,
        clock,
        undefined,
        existingAuctionView || undefined,
      );
      if (auctionView) setAuctionView(auctionView);
    }
  }, [
    clock,
    auctions,
    auctionManagers,
    safetyDepositBoxesByVaultAndIndex,
    metadataByMint,
    bidderMetadataByAuctionAndBidder,
    bidderPotsByAuctionAndBidder,
    userAccounts,
  ]);
  return existingAuctionView;
};
