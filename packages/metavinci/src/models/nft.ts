import {
  createAssociatedTokenAccountInstruction,
  createMint,
  programIds,
  sendTransaction,
} from '@oyster/common';
import { MintLayout, Token } from '@solana/spl-token';
import { WalletAdapter } from '@solana/wallet-base';
import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';

import { serialize, deserialize } from 'borsh';
class CreateMetadataArgs {
  instruction: number = 0;
  allow_duplicates: boolean = false;
  name: string = '';
  symbol: string = '';
  uri: string = '';

  constructor(name: string, symbol: string, uri: string) {
    this.name = name;
    this.symbol = symbol;
    this.uri = uri;
  }
}

export async function createMetadata(
  symbol: string,
  name: string,
  uri: string,
  mintKey: PublicKey,
  mintAuthorityKey: PublicKey,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  owner: PublicKey,
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

  const schema = new Map([
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
  ]);
  const value = new CreateMetadataArgs(name, symbol, uri);
  const data = Buffer.from(serialize(schema, value));

  //const test = deserialize(schema, CreateMetadataArgs, Buffer.alloc(data.length));
  //console.log(test);

  debugger;
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
      pubkey: payer,
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

export const mintNFT = async (
  connection: Connection,
  wallet: WalletAdapter | undefined,
  files: Buffer[],
) => {
  if (!wallet?.publicKey) {
    return;
  }

  const TOKEN_PROGRAM_ID = programIds().token;

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  const owner = new Account();
  const instructions: TransactionInstruction[] = [];
  const signers: Account[] = [owner];

  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    owner.publicKey,
    owner.publicKey,
    signers,
  );

  const recipientKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        programIds().token.toBuffer(),
        mintKey.toBuffer(),
      ],
      programIds().associatedToken,
    )
  )[0];

  createAssociatedTokenAccountInstruction(
    instructions,
    recipientKey,
    wallet.publicKey,
    wallet.publicKey,
    mintKey,
  );

  instructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintKey,
      recipientKey,
      owner.publicKey,
      [],
      1,
    ),
  );

  await createMetadata(
    `🥭🧢#`,
    `name: 🥭🧢#`,
    `https://google.com`,
    mintKey,
    owner.publicKey,
    instructions,
    wallet.publicKey,
    wallet.publicKey,
    signers,
  );

  // For Jordan -> Transfer SOL
  console.log(files.length);
  // TODO:
  // instructions.push(
  //   Token.createSetAuthorityInstruction(
  //     TOKEN_PROGRAM_ID,
  //     mintKey,
  //     owner.publicKey,
  //     owner.publicKey,
  //     []));

  const txId = await sendTransaction(
    connection,
    wallet,
    instructions,
    signers,
    true,
  );

  // TODO:
  // 1. Jordan: --- upload file and metadata to storage API
  // 2. pay for storage by hashing files and attaching memo for each file
};
