import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { programIds } from '../utils/ids';
import { deserializeBorsh } from './../utils/borsh';
import { serialize } from 'borsh';
import BN from 'bn.js';

export const METADATA_PREFIX = 'metadata';
export const EDITION = 'edition';

export const MAX_NAME_LENGTH = 32;

export const MAX_SYMBOL_LENGTH = 10;

export const MAX_URI_LENGTH = 200;

export const MAX_METADATA_LEN =
  1 + 32 + MAX_NAME_LENGTH + MAX_SYMBOL_LENGTH + MAX_URI_LENGTH + 200;

export const MAX_NAME_SYMBOL_LEN = 1 + 32 + 8;
export const MAX_MASTER_EDITION_KEN = 1 + 9 + 8 + 32;

export enum MetadataKey {
  MetadataV1 = 0,
  NameSymbolTupleV1 = 1,
  EditionV1 = 2,
  MasterEditionV1 = 3,
}

export enum MetadataCategory {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
}

export interface IMetadataExtension {
  name: string;
  symbol: string;
  description: string;
  // preview image
  image: string;
  // stores link to item on meta
  externalUrl: string;
  royalty: number;
  files?: File[];
  category: MetadataCategory;
}

export class MasterEdition {
  key: MetadataKey;
  supply: BN;
  maxSupply?: BN;
  /// Can be used to mint tokens that give one-time permission to mint a single limited edition.
  masterMint: PublicKey;

  constructor(args: {
    key: MetadataKey;
    supply: BN;
    maxSupply?: BN;
    /// Can be used to mint tokens that give one-time permission to mint a single limited edition.
    masterMint: PublicKey;
  }) {
    this.key = MetadataKey.MasterEditionV1;
    this.supply = args.supply;
    this.maxSupply = args.maxSupply;
    this.masterMint = args.masterMint;
  }
}
export class Metadata {
  key: MetadataKey;
  nonUniqueSpecificUpdateAuthority?: PublicKey;

  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;

  extended?: IMetadataExtension;

  constructor(args: {
    nonUniqueSpecificUpdateAuthority?: PublicKey;
    mint: PublicKey;
    name: string;
    symbol: string;
    uri: string;
  }) {
    this.key = MetadataKey.MetadataV1;
    this.nonUniqueSpecificUpdateAuthority =
      args.nonUniqueSpecificUpdateAuthority;
    this.mint = args.mint;
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
  }
}

export class NameSymbolTuple {
  key: MetadataKey;
  updateAuthority: PublicKey;
  metadata: PublicKey;

  constructor(args: { updateAuthority: Buffer; metadata: Buffer }) {
    this.key = MetadataKey.NameSymbolTupleV1;
    this.updateAuthority = new PublicKey(args.updateAuthority);
    this.metadata = new PublicKey(args.metadata);
  }
}

class CreateMetadataArgs {
  instruction: number = 0;
  allowDuplicates: boolean = false;
  name: string;
  symbol: string;
  uri: string;

  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    allowDuplicates?: boolean;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.allowDuplicates = !!args.allowDuplicates;
  }
}
class UpdateMetadataArgs {
  instruction: number = 1;
  uri: string;
  // Not used by this app, just required for instruction
  nonUniqueSpecificUpdateAuthority?: PublicKey;

  constructor(args: {
    uri: string;
    nonUniqueSpecificUpdateAuthority?: string;
  }) {
    this.uri = args.uri;
    this.nonUniqueSpecificUpdateAuthority = args.nonUniqueSpecificUpdateAuthority
      ? new PublicKey(args.nonUniqueSpecificUpdateAuthority)
      : undefined;
  }
}

class TransferUpdateAuthorityArgs {
  instruction: number = 2;
  constructor() {}
}

class CreateMasterEditionArgs {
  instruction: number = 3;
  maxSupply?: BN;
  constructor(args: { maxSupply?: BN }) {
    this.maxSupply = args.maxSupply;
  }
}

export const METADATA_SCHEMA = new Map<any, any>([
  [
    CreateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['allowDuplicates', 'u8'],
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
      ],
    },
  ],
  [
    UpdateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['uri', 'string'],
        [
          'nonUniqueSpecificUpdateAuthority',
          { kind: 'option', type: 'pubkey' },
        ],
      ],
    },
  ],
  [
    TransferUpdateAuthorityArgs,
    {
      kind: 'struct',
      fields: [['instruction', 'u8']],
    },
  ],
  [
    CreateMasterEditionArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
      ],
    },
  ],
  [
    MasterEdition,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['supply', 'u64'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
        ['masterMint', 'pubkey'],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        [
          'nonUniqueSpecificUpdateAuthority',
          { kind: 'option', type: 'pubkey' },
        ],
        ['mint', 'pubkey'],
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
      ],
    },
  ],
  [
    NameSymbolTuple,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['updateAuthority', 'pubkey'],
        ['metadata', 'pubkey'],
      ],
    },
  ],
]);

export const decodeMetadata = (buffer: Buffer) => {
  return deserializeBorsh(METADATA_SCHEMA, Metadata, buffer) as Metadata;
};

export async function transferUpdateAuthority(
  account: PublicKey,
  currentUpdateAuthority: PublicKey,
  newUpdateAuthority: PublicKey,
  instructions: TransactionInstruction[],
) {
  const metadataProgramId = programIds().metadata;

  const data = Buffer.from(
    serialize(METADATA_SCHEMA, new TransferUpdateAuthorityArgs()),
  );

  const keys = [
    {
      pubkey: account,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: currentUpdateAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: newUpdateAuthority,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: metadataProgramId,
      data: data,
    }),
  );
}

export async function updateMetadata(
  symbol: string,
  name: string,
  uri: string,
  newNonUniqueSpecificUpdateAuthority: string | undefined,
  mintKey: PublicKey,
  updateAuthority: PublicKey,
  instructions: TransactionInstruction[],
  metadataAccount?: PublicKey,
  nameSymbolAccount?: PublicKey,
) {
  const metadataProgramId = programIds().metadata;

  metadataAccount =
    metadataAccount ||
    (
      await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          metadataProgramId.toBuffer(),
          mintKey.toBuffer(),
        ],
        metadataProgramId,
      )
    )[0];

  nameSymbolAccount =
    nameSymbolAccount ||
    (
      await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          metadataProgramId.toBuffer(),
          Buffer.from(name),
          Buffer.from(symbol),
        ],
        metadataProgramId,
      )
    )[0];

  const value = new UpdateMetadataArgs({
    uri,
    nonUniqueSpecificUpdateAuthority: !newNonUniqueSpecificUpdateAuthority
      ? undefined
      : newNonUniqueSpecificUpdateAuthority,
  });
  const data = Buffer.from(serialize(METADATA_SCHEMA, value));
  const keys = [
    {
      pubkey: metadataAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: updateAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: nameSymbolAccount,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: metadataProgramId,
      data,
    }),
  );

  return [metadataAccount, nameSymbolAccount];
}

export async function createMetadata(
  symbol: string,
  name: string,
  uri: string,
  allowDuplicates: boolean,
  updateAuthority: PublicKey,
  mintKey: PublicKey,
  mintAuthorityKey: PublicKey,
  instructions: TransactionInstruction[],
  payer: PublicKey,
) {
  const metadataProgramId = programIds().metadata;

  const metadataAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        mintKey.toBuffer(),
      ],
      metadataProgramId,
    )
  )[0];

  const nameSymbolAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        Buffer.from(name),
        Buffer.from(symbol),
      ],
      metadataProgramId,
    )
  )[0];

  const value = new CreateMetadataArgs({ name, symbol, uri, allowDuplicates });
  const data = Buffer.from(serialize(METADATA_SCHEMA, value));

  const keys = [
    {
      pubkey: nameSymbolAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: metadataAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: mintAuthorityKey,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: updateAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: metadataProgramId,
      data,
    }),
  );

  return [metadataAccount, nameSymbolAccount];
}

export async function createMasterEdition(
  name: string,
  symbol: string,
  maxSupply: BN | undefined,
  mintKey: PublicKey,
  masterMintKey: PublicKey,
  updateAuthorityKey: PublicKey,
  mintAuthorityKey: PublicKey,
  instructions: TransactionInstruction[],
  payer: PublicKey,
) {
  const metadataProgramId = programIds().metadata;

  const metadataAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        mintKey.toBuffer(),
      ],
      metadataProgramId,
    )
  )[0];

  const nameSymbolAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        Buffer.from(name),
        Buffer.from(symbol),
      ],
      metadataProgramId,
    )
  )[0];

  const editionAccount = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        metadataProgramId.toBuffer(),
        mintKey.toBuffer(),
        Buffer.from('edition'),
      ],
      metadataProgramId,
    )
  )[0];

  const value = new CreateMasterEditionArgs({ maxSupply });
  const data = Buffer.from(serialize(METADATA_SCHEMA, value));

  const keys = [
    {
      pubkey: editionAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: masterMintKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: updateAuthorityKey,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: mintAuthorityKey,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: metadataAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: nameSymbolAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: programIds().token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: metadataProgramId,
      data,
    }),
  );
}
