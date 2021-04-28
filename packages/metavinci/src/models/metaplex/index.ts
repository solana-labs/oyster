import {
  AUCTION_PREFIX,
  deserializeBorsh,
  programIds,
  METADATA,
  METADATA_PREFIX,
  EDITION,
} from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { serialize, BinaryReader, BinaryWriter } from 'borsh';

export * from './initAuctionManager';
export * from './redeemBid';
export * from './redeemLimitedEditionBid';
export * from './redeemMasterEditionBid';
export * from './redeemOpenEditionBid';
export * from './startAuction';
export * from './validateSafetyDepositBox';

export const METAPLEX_PREFIX = 'metaplex';
export const ORIGINAL_AUTHORITY_LOOKUP_SIZE = 33;

export enum MetaplexKey {
  AuctionManagerV1 = 0,
  OriginalAuthorityLookupV1 = 1,
  BidRedemptionTicketV1 = 2,
}
export class AuctionManager {
  key: MetaplexKey;
  authority: PublicKey;
  auction: PublicKey;
  vault: PublicKey;
  auctionProgram: PublicKey;
  tokenVaultProgram: PublicKey;
  tokenMetadataProgram: PublicKey;
  tokenProgram: PublicKey;
  acceptPayment: PublicKey;
  state: AuctionManagerState;
  settings: AuctionManagerSettings;

  constructor(args: {
    authority: PublicKey;
    auction: PublicKey;
    vault: PublicKey;
    auctionProgram: PublicKey;
    tokenVaultProgram: PublicKey;
    tokenMetadataProgram: PublicKey;
    tokenProgram: PublicKey;
    acceptPayment: PublicKey;
    state: AuctionManagerState;
    settings: AuctionManagerSettings;
  }) {
    this.key = MetaplexKey.AuctionManagerV1;
    this.authority = args.authority;
    this.auction = args.auction;
    this.vault = args.vault;
    this.auctionProgram = args.auctionProgram;
    this.tokenVaultProgram = args.tokenVaultProgram;
    this.tokenMetadataProgram = args.tokenMetadataProgram;
    this.tokenProgram = args.tokenProgram;
    this.acceptPayment = args.acceptPayment;
    this.state = args.state;
    this.settings = args.settings;
  }
}

export class InitAuctionManagerArgs {
  instruction = 0;
  settings: AuctionManagerSettings;

  constructor(args: { settings: AuctionManagerSettings }) {
    this.settings = args.settings;
  }
}

export class ValidateSafetyDepositBoxArgs {
  instruction = 1;
}

export class RedeemBidArgs {
  instruction = 2;
}

export class RedeemMasterEditionBidArgs {
  instruction = 3;
}

export class RedeemLimitedEditionBidArgs {
  instruction = 4;
}

export class RedeemOpenEditionBidArgs {
  instruction = 5;
}

export class StartAuctionArgs {
  instruction = 6;
}

export class AuctionManagerSettings {
  openEditionWinnerConstraint: WinningConstraint =
    WinningConstraint.NoOpenEdition;
  openEditionNonWinningConstraint: NonWinningConstraint =
    NonWinningConstraint.GivenForFixedPrice;
  winningConfigs: WinningConfig[] = [];
  openEditionConfig: number | null = 0;
  openEditionFixedPrice: number | null = 0;

  constructor(args?: AuctionManagerSettings) {
    Object.assign(this, args);
  }
}

export enum WinningConstraint {
  NoOpenEdition = 0,
  OpenEditionGiven = 1,
}

export enum NonWinningConstraint {
  NoOpenEdition = 0,
  GivenForFixedPrice = 1,
  GivenForBidPrice = 2,
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
  safetyDepositBoxIndex: number = 0;
  amount: number = 0;
  editionType: EditionType = EditionType.NA;

  constructor(args?: WinningConfig) {
    Object.assign(this, args);
  }
}
export const decodeAuctionManager = (buffer: Buffer) => {
  return deserializeBorsh(SCHEMA, AuctionManager, buffer) as AuctionManager;
};

export const decodeBidRedemptionTicket = (buffer: Buffer) => {
  return deserializeBorsh(
    SCHEMA,
    BidRedemptionTicket,
    buffer,
  ) as BidRedemptionTicket;
};

export class WinningConfigState {
  amountMinted: number = 0;
  validated: boolean = false;
  claimed: boolean = false;

  constructor(args?: WinningConfigState) {
    Object.assign(this, args);
  }
}

export class AuctionManagerState {
  status: AuctionManagerStatus = AuctionManagerStatus.Initialized;
  winningConfigsValidated: number = 0;
  masterEditionsWithAuthoritiesRemainingToReturn: number = 0;

  winningConfigStates: WinningConfigState[] = [];

  constructor(args?: AuctionManagerState) {
    Object.assign(this, args);
  }
}

export enum AuctionManagerStatus {
  Initialized,
  Validated,
  Running,
  Disbursing,
  Finished,
}

export class BidRedemptionTicket {
  key: MetaplexKey = MetaplexKey.BidRedemptionTicketV1;
  openEditionRedeemed: boolean = false;
  bidRedeemed: boolean = false;

  constructor(args?: BidRedemptionTicket) {
    Object.assign(this, args);
  }
}

export const SCHEMA = new Map<any, any>([
  [
    AuctionManager,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['authority', 'pubkey'],
        ['auction', 'pubkey'],
        ['vault', 'pubkey'],
        ['auctionProgram', 'pubkey'],
        ['tokenVaultProgram', 'pubkey'],
        ['tokenMetadataProgram', 'pubkey'],
        ['tokenProgram', 'pubkey'],
        ['acceptPayment', 'pubkey'],
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
        ['openEditionWinnerConstraint', 'u8'], // enum
        ['openEditionNonWinningConstraint', 'u8'],
        ['winningConfigs', [WinningConfig]],
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
        ['editionType', 'u8'],
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
        ['status', 'u8'],
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
  [
    InitAuctionManagerArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['settings', AuctionManagerSettings],
      ],
    },
  ],
  [
    ValidateSafetyDepositBoxArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RedeemBidArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RedeemMasterEditionBidArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RedeemLimitedEditionBidArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    RedeemOpenEditionBidArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    StartAuctionArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
]);

export async function getAuctionManagerKey(
  vault: PublicKey,
  auctionKey: PublicKey,
): Promise<PublicKey> {
  const PROGRAM_IDS = programIds();

  return (
    await PublicKey.findProgramAddress(
      [Buffer.from(METAPLEX_PREFIX), auctionKey.toBuffer()],
      PROGRAM_IDS.metaplex,
    )
  )[0];
}

export async function getAuctionKeys(
  vault: PublicKey,
): Promise<{ auctionKey: PublicKey; auctionManagerKey: PublicKey }> {
  const PROGRAM_IDS = programIds();

  const auctionKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from(AUCTION_PREFIX),
        PROGRAM_IDS.auction.toBuffer(),
        vault.toBuffer(),
      ],
      PROGRAM_IDS.auction,
    )
  )[0];

  const auctionManagerKey = await getAuctionManagerKey(vault, auctionKey);

  return { auctionKey, auctionManagerKey };
}

export async function getBidderKeys(
  auctionKey: PublicKey,
  bidder: PublicKey,
): Promise<{ bidMetadata: PublicKey; bidRedemption: PublicKey }> {
  const PROGRAM_IDS = programIds();

  const bidMetadata: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from(AUCTION_PREFIX),
        PROGRAM_IDS.auction.toBuffer(),
        auctionKey.toBuffer(),
        bidder.toBuffer(),
        Buffer.from(METADATA),
      ],
      PROGRAM_IDS.auction,
    )
  )[0];

  const bidRedemption: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from(METAPLEX_PREFIX),
        auctionKey.toBuffer(),
        bidMetadata.toBuffer(),
      ],
      PROGRAM_IDS.metaplex,
    )
  )[0];

  return { bidMetadata, bidRedemption };
}

export async function getOriginalAuthority(
  auctionKey: PublicKey,
  metadata: PublicKey,
): Promise<PublicKey> {
  const PROGRAM_IDS = programIds();

  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from(METAPLEX_PREFIX),
        auctionKey.toBuffer(),
        metadata.toBuffer(),
      ],
      PROGRAM_IDS.metaplex,
    )
  )[0];
}
