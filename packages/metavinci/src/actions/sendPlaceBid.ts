import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  actions,
  ParsedAccount,
  SequenceType,
  sendTransactionWithRetry,
  placeBid,
  programIds,
  BidderPot,
  models,
  WalletSigner,
  WalletNotConnectedError,
} from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import { AuctionView } from '../hooks';
import BN from 'bn.js';

const { createTokenAccount } = actions;
const { approve } = models;

export async function sendPlaceBid(
  connection: Connection,
  wallet: WalletSigner,
  bidderAccount: PublicKey,
  auctionView: AuctionView,
  amount: number,
) {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  let bidderPotTokenAccount: PublicKey;
  if (!auctionView.myBidderPot) {
    bidderPotTokenAccount = createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt,
      auctionView.auction.info.tokenMint,
      programIds().auction,
      signers,
    );
  } else bidderPotTokenAccount = auctionView.myBidderPot?.info.bidderPot;

  const transferAuthority = approve(
    instructions,
    [],
    bidderAccount,
    wallet.publicKey,
    amount,
  );

  signers.push(transferAuthority);

  await placeBid(
    bidderAccount,
    bidderPotTokenAccount,
    auctionView.auction.info.tokenMint,
    transferAuthority.publicKey,
    wallet.publicKey,
    auctionView.auctionManager.info.vault,
    new BN(amount),
    instructions,
  );

  await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
    'single',
  );
}
