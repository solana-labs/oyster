import { programIds, VAULT_SCHEMA } from '@oyster/common';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { serialize } from 'borsh';

import {
  getAuctionKeys,
  getBidderKeys,
  getEdition,
  getMetadata,
  getOriginalAuthority,
  RedeemLimitedEditionBidArgs,
} from '.';

export async function redeemLimitedEditionBid(
  vault: PublicKey,
  store: PublicKey,
  destination: PublicKey,
  safetyDeposit: PublicKey,
  fractionMint: PublicKey,
  bidder: PublicKey,
  payer: PublicKey,
  instructions: TransactionInstruction[],
  // as in original authority on the master metadata before it was shifted to auction manager, check
  // originalAuthorityLookupKey's record for this value or just "know it" because it might be elsewhere.
  originalAuthority: PublicKey,
  tokenMint: PublicKey,
  masterMint: PublicKey,
) {
  const PROGRAM_IDS = programIds();

  const { auctionKey, auctionManagerKey } = await getAuctionKeys(vault);

  const { bidRedemption, bidMetadata } = await getBidderKeys(
    auctionKey,
    bidder,
  );

  const masterMetadata: PublicKey = await getMetadata(tokenMint);

  const masterEdition: PublicKey = await getEdition(tokenMint);

  const originalAuthorityLookupKey: PublicKey = await getOriginalAuthority(
    auctionKey,
    masterMetadata,
  );

  const value = new RedeemLimitedEditionBidArgs();
  const data = Buffer.from(serialize(VAULT_SCHEMA, value));
  const keys = [
    {
      pubkey: auctionManagerKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: store,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: destination,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: bidRedemption,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: safetyDeposit,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vault,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: fractionMint,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: auctionKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: bidMetadata,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: bidder,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
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
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: masterMetadata,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: masterMint,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: masterEdition,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: originalAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: originalAuthorityLookupKey,
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
