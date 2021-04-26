import {
  ParsedAccount,
  Metadata,
  SafetyDepositBox,
  AuctionData,
  useConnection,
  AuctionState,
} from '@oyster/common';
import { useEffect, useState } from 'react';
import { useMeta } from '../contexts';
import { AuctionManager } from '../models/metaplex';

export enum AuctionViewState {
  Live = '0',
  Upcoming = '1',
  Ended = '2',
  BuyNow = '3',
}

export interface AuctionViewItem {
  metadata: ParsedAccount<Metadata>;
  safetyDeposit: ParsedAccount<SafetyDepositBox>;
}

// Flattened surface item for easy display
export interface AuctionView {
  items: AuctionViewItem[];
  auction: ParsedAccount<AuctionData>;
  auctionManager: ParsedAccount<AuctionManager>;
  openEditionItem?: AuctionViewItem;
  state: AuctionViewState;
  thumbnail: AuctionViewItem;
}

export const useAuctions = (state: AuctionViewState) => {
  const connection = useConnection();
  const [clock, setClock] = useState<number>(0);
  const [auctionViews, setAuctionViews] = useState<AuctionView[]>([]);
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
    const newAuctionViews: AuctionView[] = [];
    Object.keys(auctions).forEach(a => {
      const auction = auctions[a];
      const auctionView = processAccountsIntoAuctionView(
        auction,
        auctionManagers,
        safetyDepositBoxesByVaultAndIndex,
        metadataByMint,
        clock,
        state,
      );
      if (auctionView) newAuctionViews.push(auctionView);
    });
    setAuctionViews(newAuctionViews);
  }, [clock, state, auctions]);

  return auctionViews;
};

export function processAccountsIntoAuctionView(
  auction: ParsedAccount<AuctionData>,
  auctionManagers: Record<string, ParsedAccount<AuctionManager>>,
  safetyDepositBoxesByVaultAndIndex: Record<
    string,
    ParsedAccount<SafetyDepositBox>
  >,
  metadataByMint: Record<string, ParsedAccount<Metadata>>,
  clock: number,
  desiredState: AuctionViewState | undefined,
) {
  let state: AuctionViewState;
  if (
    auction.info.state == AuctionState.Ended ||
    (auction.info.endedAt && auction.info.endedAt.toNumber() <= clock)
  ) {
    state = AuctionViewState.Ended;
  } else if (
    auction.info.state == AuctionState.Started ||
    (auction.info.endedAt && auction.info.endedAt.toNumber() > clock)
  ) {
    state = AuctionViewState.Live;
  } else if (auction.info.state == AuctionState.Created) {
    state = AuctionViewState.Upcoming;
  } else {
    state = AuctionViewState.BuyNow;
  }

  if (desiredState && desiredState != state) return null;

  const auctionManager =
    auctionManagers[auction.info.auctionManagerKey?.toBase58() || ''];
  if (auctionManager) {
    let boxes: ParsedAccount<SafetyDepositBox>[] = [];
    let box =
      safetyDepositBoxesByVaultAndIndex[
        auctionManager.info.vault.toBase58() + '-0'
      ];
    if (box) {
      boxes.push(box);
      let i = 1;
      while (box) {
        box =
          safetyDepositBoxesByVaultAndIndex[
            auctionManager.info.vault.toBase58() + '-' + i.toString()
          ];
        if (box) boxes.push(box);
        i++;
      }
    }

    if (boxes.length > 0) {
      let view: any = {
        auction,
        auctionManager,
        state,
        items: auctionManager.info.settings.winningConfigs.map(w => ({
          metadata:
            metadataByMint[
              boxes[w.safetyDepositBoxIndex].info.tokenMint.toBase58()
            ],
          safetyDeposit: boxes[w.safetyDepositBoxIndex],
        })),
        openEditionItem:
          auctionManager.info.settings.openEditionConfig != null
            ? {
                metadata:
                  metadataByMint[
                    boxes[
                      auctionManager.info.settings.openEditionConfig
                    ].info.tokenMint.toBase58()
                  ],
                safetyDeposit:
                  boxes[auctionManager.info.settings.openEditionConfig],
              }
            : undefined,
      };

      view.thumbnail = view.items[0] || view.openEditionItem;
      if (!view.thumbnail || !view.thumbnail.metadata) return null;
      return view;
    }
  }

  return null;
}
