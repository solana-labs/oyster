import {
  ParsedAccount,
  Metadata,
  SafetyDepositBox,
  AuctionData,
  useConnection,
  AuctionState,
  BidderMetadata,
  BidderPot,
  useUserAccounts,
  TokenAccount,
  Vault,
  MasterEdition,
  NameSymbolTuple,
} from '@oyster/common';
import { useEffect, useState } from 'react';
import { useMeta } from '../contexts';
import { AuctionManager, BidRedemptionTicket } from '../models/metaplex';

export enum AuctionViewState {
  Live = '0',
  Upcoming = '1',
  Ended = '2',
  BuyNow = '3',
}

export interface AuctionViewItem {
  metadata: ParsedAccount<Metadata>;
  nameSymbol?: ParsedAccount<NameSymbolTuple>;
  safetyDeposit: ParsedAccount<SafetyDepositBox>;
  masterEdition?: ParsedAccount<MasterEdition>;
}

// Flattened surface item for easy display
export interface AuctionView {
  items: AuctionViewItem[];
  auction: ParsedAccount<AuctionData>;
  auctionManager: ParsedAccount<AuctionManager>;
  openEditionItem?: AuctionViewItem;
  state: AuctionViewState;
  thumbnail: AuctionViewItem;
  myBidderMetadata?: ParsedAccount<BidderMetadata>;
  myBidderPot?: ParsedAccount<BidderPot>;
  myBidRedemption?: ParsedAccount<BidRedemptionTicket>;
  vault: ParsedAccount<Vault>;
  totallyComplete: boolean;
}

export const useAuctions = (state: AuctionViewState) => {
  const { userAccounts } = useUserAccounts();
  const accountByMint = userAccounts.reduce((prev, acc) => {
    prev.set(acc.info.mint.toBase58(), acc);
    return prev;
  }, new Map<string, TokenAccount>());

  const [auctionViews, setAuctionViews] = useState<
    Record<string, AuctionView | undefined>
  >({});

  const {
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
  } = useMeta();

  useEffect(() => {
    Object.keys(auctions).forEach(a => {
      const auction = auctions[a];
      const existingAuctionView = auctionViews[a];
      const nextAuctionView = processAccountsIntoAuctionView(
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
        state,
        existingAuctionView,
      );
      setAuctionViews(nA => ({ ...nA, [a]: nextAuctionView }));
    });
  }, [
    state,
    auctions,
    auctionManagers,
    safetyDepositBoxesByVaultAndIndex,
    metadataByMint,
    bidderMetadataByAuctionAndBidder,
    bidderPotsByAuctionAndBidder,
    userAccounts,
    vaults,
    nameSymbolTuples,
    masterEditions,
    bidRedemptions,
  ]);

  return Object.values(auctionViews).filter(v => v) as AuctionView[];
};

export function processAccountsIntoAuctionView(
  auction: ParsedAccount<AuctionData>,
  auctionManagers: Record<string, ParsedAccount<AuctionManager>>,
  safetyDepositBoxesByVaultAndIndex: Record<
    string,
    ParsedAccount<SafetyDepositBox>
  >,
  metadataByMint: Record<string, ParsedAccount<Metadata>>,
  nameSymbolTuples: Record<string, ParsedAccount<NameSymbolTuple>>,
  bidRedemptions: Record<string, ParsedAccount<BidRedemptionTicket>>,
  bidderMetadataByAuctionAndBidder: Record<
    string,
    ParsedAccount<BidderMetadata>
  >,
  bidderPotsByAuctionAndBidder: Record<string, ParsedAccount<BidderPot>>,
  masterEditions: Record<string, ParsedAccount<MasterEdition>>,
  vaults: Record<string, ParsedAccount<Vault>>,
  accountByMint: Map<string, TokenAccount>,
  desiredState: AuctionViewState | undefined,
  existingAuctionView?: AuctionView,
): AuctionView | undefined {
  let state: AuctionViewState;
  if (auction.info.state == AuctionState.Ended) {
    state = AuctionViewState.Ended;
  } else if (auction.info.state == AuctionState.Started) {
    state = AuctionViewState.Live;
  } else if (auction.info.state == AuctionState.Created) {
    state = AuctionViewState.Upcoming;
  } else {
    state = AuctionViewState.BuyNow;
  }

  if (desiredState && desiredState != state) return undefined;

  const myPayingAccount = accountByMint.get(auction.info.tokenMint.toBase58());

  const auctionManager =
    auctionManagers[auction.info.auctionManagerKey?.toBase58() || ''];
  if (auctionManager) {
    const boxesExpected = auctionManager.info.state.winningConfigsValidated;

    let bidRedemption:
      | ParsedAccount<BidRedemptionTicket>
      | undefined = undefined;
    if (auction.info.bidRedemptionKey?.toBase58()) {
      bidRedemption = bidRedemptions[auction.info.bidRedemptionKey?.toBase58()];
    }

    const bidderMetadata =
      bidderMetadataByAuctionAndBidder[
        auction.pubkey.toBase58() + '-' + myPayingAccount?.pubkey.toBase58()
      ];
    const bidderPot =
      bidderPotsByAuctionAndBidder[
        auction.pubkey.toBase58() + '-' + myPayingAccount?.pubkey.toBase58()
      ];

    if (existingAuctionView && existingAuctionView.totallyComplete) {
      // If totally complete, we know we arent updating anythign else, let's speed things up
      // and only update the two things that could possibly change
      existingAuctionView.myBidderPot = bidderPot;
      existingAuctionView.myBidderMetadata = bidderMetadata;
      existingAuctionView.myBidRedemption = bidRedemption;
      for (let i = 0; i < existingAuctionView.items.length; i++) {
        let curr = existingAuctionView.items[i];
        if (!curr.metadata) {
          let foundMetadata =
            metadataByMint[curr.safetyDeposit.info.tokenMint.toBase58()];
          curr.metadata = foundMetadata;
        }
        if (
          curr.metadata &&
          !curr.nameSymbol &&
          curr.metadata.info.nameSymbolTuple
        ) {
          let foundNS =
            nameSymbolTuples[curr.metadata.info.nameSymbolTuple.toBase58()];
          curr.nameSymbol = foundNS;
        }

        if (
          curr.metadata &&
          !curr.masterEdition &&
          curr.metadata.info.masterEdition
        ) {
          let foundMaster =
            masterEditions[curr.metadata.info.masterEdition.toBase58()];

          curr.masterEdition = foundMaster;
        }
      }

      return existingAuctionView;
    }

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
      let view: Partial<AuctionView> = {
        auction,
        auctionManager,
        state,
        vault: vaults[auctionManager.info.vault.toBase58()],
        items: auctionManager.info.settings.winningConfigs.map(w => {
          let metadata =
            metadataByMint[
              boxes[w.safetyDepositBoxIndex].info.tokenMint.toBase58()
            ];
          return {
            metadata,
            nameSymbol: metadata?.info?.nameSymbolTuple
              ? nameSymbolTuples[metadata.info.nameSymbolTuple.toBase58()]
              : undefined,
            safetyDeposit: boxes[w.safetyDepositBoxIndex],
            masterEdition: metadata?.info?.masterEdition
              ? masterEditions[metadata.info.masterEdition.toBase58()]
              : undefined,
          };
        }),
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
                masterEdition:
                  masterEditions[
                    metadataByMint[
                      boxes[
                        auctionManager.info.settings.openEditionConfig
                      ].info.tokenMint.toBase58()
                    ]?.info.masterEdition?.toBase58() || ''
                  ],
              }
            : undefined,
        myBidderMetadata: bidderMetadata,
        myBidderPot: bidderPot,
        myBidRedemption: bidRedemption,
      };

      view.thumbnail = (view.items || [])[0] || view.openEditionItem;
      view.totallyComplete = !!(
        view.thumbnail &&
        boxesExpected ==
          (view.items || []).length +
            (auctionManager.info.settings.openEditionConfig == null ? 0 : 1) &&
        (auctionManager.info.settings.openEditionConfig == null ||
          (auctionManager.info.settings.openEditionConfig != null &&
            view.openEditionItem)) &&
        view.vault
      );
      if (!view.thumbnail || !view.thumbnail.metadata) return undefined;
      return view as AuctionView;
    }
  }

  return undefined;
}
