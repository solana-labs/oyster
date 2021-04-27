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
    masterEditions,
    nameSymbolTuples,
    bidRedemptions,
    vaults,
  } = useMeta();

  useEffect(() => {
    const auction = auctions[id];
    if (auction) {
      const auctionView = processAccountsIntoAuctionView(
        auction,
        auctionManagers,
        safetyDepositBoxesByVaultAndIndex,
        metadataByMint,
        nameSymbolTuples,
        bidRedemptions,
        bidderMetadataByAuctionAndBidder,
        bidderPotsByAuctionAndBidder,
        masterEditions,
        vaults,
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
    vaults,
    nameSymbolTuples,
    masterEditions,
    bidRedemptions,
    userAccounts,
  ]);
  return existingAuctionView;
};
