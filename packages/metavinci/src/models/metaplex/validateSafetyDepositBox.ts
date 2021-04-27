import { programIds, getEdition } from '@oyster/common';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { serialize } from 'borsh';

import {
  getAuctionKeys,
  getOriginalAuthority,
  SCHEMA,
  ValidateSafetyDepositBoxArgs,
} from '.';

export async function validateSafetyDepositBox(
  vault: PublicKey,
  metadata: PublicKey,
  nameSymbol: PublicKey | undefined,
  safetyDepositBox: PublicKey,
  store: PublicKey,
  tokenMint: PublicKey,
  auctionManagerAuthority: PublicKey,
  metadataAuthority: PublicKey,
  payer: PublicKey,
  instructions: TransactionInstruction[],
  masterMint?: PublicKey,
  masterMintAuthority?: PublicKey,
) {
  const PROGRAM_IDS = programIds();

  const { auctionKey, auctionManagerKey } = await getAuctionKeys(vault);

  const originalAuthorityLookup: PublicKey = await getOriginalAuthority(
    auctionKey,
    metadata,
  );

  const edition: PublicKey = await getEdition(tokenMint);
  const value = new ValidateSafetyDepositBoxArgs();

  const data = Buffer.from(serialize(SCHEMA, value));
  const keys = [
    {
      pubkey: auctionManagerKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: metadata,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: nameSymbol || SystemProgram.programId,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: originalAuthorityLookup,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: safetyDepositBox,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: store,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: tokenMint,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: edition,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: vault,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: auctionManagerAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: metadataAuthority,
      isSigner: true,
      isWritable: false,
    },

    {
      pubkey: payer,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.metadata,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.token,
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

  if (masterMint && masterMintAuthority) {
    keys.push({
      pubkey: masterMint,
      isSigner: false,
      isWritable: true,
    });

    keys.push({
      pubkey: masterMintAuthority,
      isSigner: true,
      isWritable: false,
    });
  }
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.metaplex,
      data,
    }),
  );
}
