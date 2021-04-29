import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, actions, WinnerLimit } from '@oyster/common';

import BN from 'bn.js';
import { METAPLEX_PREFIX } from '../models/metaplex';
const { AUCTION_PREFIX, createAuction } = actions;

// This command makes an auction
export async function makeAuction(
  wallet: any,
  winnerLimit: WinnerLimit,
  vault: PublicKey,
  endAuctionAt: BN,
  auctionGap: BN,
  paymentMint: PublicKey,
): Promise<{
  auction: PublicKey;
  instructions: TransactionInstruction[];
  signers: Account[];
}> {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
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

  const auctionManagerKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [Buffer.from(METAPLEX_PREFIX), auctionKey.toBuffer()],
      PROGRAM_IDS.metaplex,
    )
  )[0];

  createAuction(
    winnerLimit,
    vault,
    endAuctionAt,
    auctionGap,
    paymentMint,
    auctionManagerKey,
    wallet.publicKey,
    instructions,
  );

  return { instructions, signers, auction: auctionKey };
}
