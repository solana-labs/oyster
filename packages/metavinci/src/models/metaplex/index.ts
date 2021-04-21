import { PublicKey } from '@solana/web3.js';

export * from './initAuctionManager';
export * from './redeemBid';
export * from './redeemLimitedEditionBid';
export * from './redeemMasterEditionBid';
export * from './redeemOpenEditionBid';
export * from './startAuction';
export * from './validateSafetyDepositBox';

export class AuctionManager {
  key?: number;
  authority?: PublicKey;
  auction?: PublicKey;
  vault?: PublicKey;
  auctionProgram?: PublicKey;
  tokenVaultProgram?: PublicKey;
  tokenMetadataProgram?: PublicKey;
  tokenProgram?: PublicKey;
  state?: AuctionManagerState;
  settings?: AuctionManagerSettings;
}

export class AuctionManagerSettings {
  openEditionWinnerConstraint?: WinningConstraint;
  openEditionNonWinningConstraint?: NonWinningConstraint;
  winningConfigs?: WinningConfig[];
  openEditionConfig?: number;
  openEditionFixedPrice?: number;
}

export enum WinningConstraint {
  NoOpenEdition,
  OpenEditionGiven,
}

export enum NonWinningConstraint {
  NoOpenEdition,
  GivenForFixedPrice,
  GivenForBidPrice,
}

export enum EditionType {
  // Not an edition
  NA,
  /// Means you are auctioning off the master edition record
  MasterEdition,
  /// Means you are using the master edition to print off new editions during the auction (limited or open edition)
  LimitedEdition,
}

export class WinningConfig {
  safetyDepositBoxIndex?: number;
  amount?: number;
  hasAuthority?: boolean;
  editionType?: EditionType;
}

export class WinningConfigState {
  /// Used for cases of minting Limited Editions and keeping track of how many have been made so far.
  amountMinted?: number;
  /// Each safety deposit box needs to be validated via endpoint before auction manager will agree to let auction begin.
  validated?: boolean;
  /// Ticked to true when a prize is claimed
  claimed?: boolean;
}

export class AuctionManagerState {
  status?: AuctionManagerStatus;
  /// When all configs are validated the auction is started and auction manager moves to Running
  winningConfigsValidated?: number;

  /// Each master edition used as a template has to grant it's authority to the auction manager.
  /// This counter is incremented by one each time this is done. At the end of the auction; this is decremented
  /// each time authority is delegated back to the owner or the new owner and when it hits 0 another condition
  /// is met for going to Finished state.
  masterEditionsWithAuthoritiesRemainingToReturn?: number;

  winningConfigStates?: WinningConfigState[];
}

export enum AuctionManagerStatus {
  Initialized,
  Validated,
  Running,
  Disbursing,
  Finished,
}

export class BidRedemptionTicket {
  openEditionRedeemed?: boolean;
  bidRedeemed?: boolean;
}

export const SCHEMA = new Map<any, any>([
  [
    AuctionManager,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['authority', 'u32'],
        ['auction', 'u32'],
        ['vault', 'u32'],
        ['auctionProgram', 'u32'],
        ['tokenVaultProgram', 'u32'],
        ['tokenMetadataProgram', 'u32'],
        ['tokenProgram', 'u32'],
        ['state', AuctionManagerState],
        ['settings', AuctionManagerSettings],
      ],
    },
  ],
  [
    AuctionManagerSettings,
    {
      kind: 'struct',
      fields: [
        ['openEditionWinnerConstraint', { kind: 'enum' }], // TODO:
        ['openEditionNonWinningConstraint', { kind: 'enum' }], // TODO:
        ['winningConfigs', [WinningConfig]], // TODO: check
        ['openEditionConfig', { kind: 'option', type: 'u8' }],
        ['openEditionFixedPrice', { kind: 'option', type: 'u8' }],
      ],
    },
  ],
  [
    WinningConfig,
    {
      kind: 'struct',
      fields: [
        ['safetyDepositBoxIndex', 'u8'],
        ['amount', 'u8'],
        ['hasAuthority', 'u8'], // bool
        ['editionType', { kind: 'enum' }], // TODO:
      ],
    },
  ],
  [
    WinningConfigState,
    {
      kind: 'struct',
      fields: [
        ['amountMinted', 'u8'],
        ['validated', 'u8'], // bool
        ['claimed', 'u8'], // bool
      ],
    },
  ],
  [
    AuctionManagerState,
    {
      kind: 'struct',
      fields: [
        // TODO: fix enum
        ['status', { kind: 'enum' }],
        ['winningConfigsValidated', 'u8'],
        ['masterEditionsWithAuthoritiesRemainingToReturn', 'u8'],
        ['winningConfigStates', [WinningConfigState]],
      ],
    },
  ],
  [
    BidRedemptionTicket,
    {
      kind: 'struct',
      fields: [
        ['openEditionRedeemed', 'u8'], // bool
        ['bidRedeemed', 'u8'], // bool
      ],
    },
  ],
]);
