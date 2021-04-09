import {
  Account,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { programIds } from '../utils/ids';
import { deserializeBorsh } from './../utils/borsh';
import { serialize } from 'borsh';

export const MAX_NAME_LENGTH = 32;

export const MAX_SYMBOL_LENGTH = 10;

export const MAX_URI_LENGTH = 200;

export const MAX_METADATA_LEN =
  32 + MAX_NAME_LENGTH + MAX_SYMBOL_LENGTH + MAX_URI_LENGTH + 200;

export const MAX_OWNER_LEN = 32 + 32;

export const METADATA_KEY = 0;
export const NAME_SYMBOL_KEY = 1;

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

export class Metadata {
  key: number;
  updateAuthority?: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  extended?: IMetadataExtension;

  constructor(args: {
    updateAuthority?: Buffer;
    mint: Buffer;
    name: string;
    symbol: string;
    uri: string;
  }) {
    this.key = METADATA_KEY;
    this.updateAuthority =
      args.updateAuthority && new PublicKey(args.updateAuthority);
    this.mint = new PublicKey(args.mint);
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
  }
}

export class NameSymbolTuple {
  key: number;
  updateAuthority: PublicKey;
  metadata: PublicKey;

  constructor(args: { updateAuthority: Buffer; metadata: Buffer }) {
    this.key = NAME_SYMBOL_KEY;
    this.updateAuthority = new PublicKey(args.updateAuthority);
    this.metadata = new PublicKey(args.metadata);
  }
}

class CreateMetadataArgs {
  instruction: number = 0;
  allow_duplicates: boolean = false;
  name: string;
  symbol: string;
  uri: string;

  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    allow_duplicates?: boolean;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.allow_duplicates = !!args.allow_duplicates;
  }
}
class UpdateMetadataArgs {
  instruction: number = 1;
  uri: string;
  // Not used by this app, just required for instruction
  non_unique_specific_update_authority: number;

  constructor(args: { uri: string }) {
    this.uri = args.uri;
    this.non_unique_specific_update_authority = 0;
  }
}

export const SCHEMA = new Map<any, any>([
  [
    CreateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['allow_duplicates', 'u8'],
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
        ['non_unique_specific_update_authority', 'u8'],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['allow_duplicates', { kind: 'option', type: 'u8' }],
        ['mint', [32]],
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
        ['update_authority', [32]],
        ['metadata', [32]],
      ],
    },
  ],
]);

export const decodeMetadata = (buffer: Buffer) => {
  return deserializeBorsh(SCHEMA, Metadata, buffer) as Metadata;
};
export async function updateMetadata(
  symbol: string,
  name: string,
  uri: string,
  mintKey: PublicKey,
  updateAuthority: PublicKey,
  instructions: TransactionInstruction[],
  signers: Account[],
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

  const metadataOwnerAccount = (
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

  const value = new UpdateMetadataArgs({ uri });
  const data = Buffer.from(serialize(SCHEMA, value));

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
      pubkey: metadataOwnerAccount,
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
export async function createMetadata(
  symbol: string,
  name: string,
  uri: string,
  allow_duplicates: boolean,
  updateAuthority: PublicKey,
  mintKey: PublicKey,
  mintAuthorityKey: PublicKey,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  signers: Account[],
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

  const metadataOwnerAccount = (
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

  const value = new CreateMetadataArgs({ name, symbol, uri, allow_duplicates });
  const data = Buffer.from(serialize(SCHEMA, value));

  const keys = [
    {
      pubkey: metadataOwnerAccount,
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
      isSigner: true,
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
