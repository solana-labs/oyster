import { programIds } from '@oyster/common';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { serialize } from 'borsh';

import {
  AuctionManagerSettings,
  getAuctionKeys,
  InitAuctionManagerArgs,
  SCHEMA,
} from '.';

export async function initAuctionManager(
  vault: PublicKey,
  openEditionMetadata: PublicKey | undefined,
  openEditionNameSymbol: PublicKey | undefined,
  openEditionAuthority: PublicKey | undefined,
  openEditionMasterAccount: PublicKey | undefined,
  openEditionMint: PublicKey | undefined,
  openEditionMasterMint: PublicKey | undefined,
  openEditionMasterMintAuthority: PublicKey | undefined,
  auctionManagerAuthority: PublicKey,
  payer: PublicKey,
  acceptPaymentAccount: PublicKey,
  settings: AuctionManagerSettings,
  instructions: TransactionInstruction[],
) {
  const PROGRAM_IDS = programIds();
  const { auctionKey, auctionManagerKey } = await getAuctionKeys(vault);

  const value = new InitAuctionManagerArgs({
    settings,
  });

  const data = Buffer.from(serialize(SCHEMA, value));
  console.log(
    'Auction',
    auctionManagerKey,
    vault,
    auctionKey,
    auctionManagerAuthority,
    payer,
    acceptPaymentAccount,
  );
  const keys = [
    {
      pubkey: auctionManagerKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vault,
      isSigner: false,
      isWritable: false,
    },

    {
      pubkey: auctionKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: openEditionMetadata || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: openEditionNameSymbol || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: openEditionAuthority || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: openEditionMasterAccount || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: openEditionMint || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: openEditionMasterMint || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: openEditionMasterMintAuthority || SystemProgram.programId, // Won't actually be used if openEditionConfig is null
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: auctionManagerAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: acceptPaymentAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.vault,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.metadata,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.auction,
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
      programId: PROGRAM_IDS.metaplex,
      data,
    }),
  );
}
