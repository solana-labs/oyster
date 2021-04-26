import {
  ParsedAccount,
  Metadata,
  SafetyDepositBox,
  AuctionData,
  useConnection,
  AuctionState,
} from '@oyster/common';
import { useEffect, useState } from 'react';
import { AuctionView, processAccountsIntoAuctionView } from '.';
import { useMeta } from '../contexts';
import { AuctionManager } from '../models/metaplex';
import { sampleAuction } from '../views/home/sampleData';

export const useAuction = (id: string) => {
  const connection = useConnection();
  const [clock, setClock] = useState<number>(0);
  const [auctionView, setAuctionView] = useState<AuctionView | null>(null);
  useEffect(() => {
    connection.getSlot().then(setClock);
  }, [connection]);

  const {
    auctions,
    auctionManagers,
    safetyDepositBoxesByVaultAndIndex,
    metadataByMint,
  } = useMeta();

  useEffect(() => {
    const auction = auctions[id];
    if (auction) {
      const auctionView = processAccountsIntoAuctionView(
        auction,
        auctionManagers,
        safetyDepositBoxesByVaultAndIndex,
        metadataByMint,
        clock,
        undefined,
      );
      if (auctionView) setAuctionView(auctionView);
    }
  }, [clock]);
  return auctionView;
};
