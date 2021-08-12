import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  actions,
  ParsedAccount,
  programIds,
  models,
  TokenAccount,
  getNameSymbol,
  createMint,
  mintNewEditionFromMasterEditionViaToken,
  SafetyDepositBox,
  SequenceType,
  sendTransactions,
  sendSignedTransaction,
  sendTransactionWithRetry,
  WalletSigner,
} from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import { AuctionView, AuctionViewItem } from '../hooks';
import {
  EditionType,
  getOriginalAuthority,
  NonWinningConstraint,
  redeemBid,
  redeemLimitedEditionBid,
  redeemMasterEditionBid,
  redeemOpenEditionBid,
  WinningConfig,
  WinningConstraint,
} from '../models/metaplex';
const { createTokenAccount } = actions;
const { approve } = models;

export async function sendRedeemBid(
  connection: Connection,
  wallet: WalletSigner,
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
) {
  let signers: Array<Account[]> = [];
  let instructions: Array<TransactionInstruction[]> = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  let winnerIndex = null;
  if (auctionView.myBidderPot?.pubkey)
    winnerIndex = auctionView.auction.info.bidState.getWinnerIndex(
      auctionView.myBidderPot?.pubkey,
    );
  console.log('Winner index', winnerIndex);

  if (winnerIndex != null) {
    const winningConfig =
      auctionView.auctionManager.info.settings.winningConfigs[winnerIndex];
    const item = auctionView.items[winnerIndex];
    const safetyDeposit = item.safetyDeposit;
    switch (winningConfig.editionType) {
      case EditionType.LimitedEdition:
        console.log('Redeeming limited');
        await setupRedeemLimitedInstructions(
          connection,
          auctionView,
          accountsByMint,
          accountRentExempt,
          mintRentExempt,
          wallet,
          safetyDeposit,
          item,
          signers,
          instructions,
          winningConfig,
        );
        break;
      case EditionType.MasterEdition:
        console.log('Redeeming master');
        await setupRedeemMasterInstructions(
          auctionView,
          accountsByMint,
          accountRentExempt,
          wallet,
          safetyDeposit,
          item,
          signers,
          instructions,
        );
        break;
      case EditionType.NA:
        console.log('Redeeming normal');
        await setupRedeemInstructions(
          auctionView,
          accountsByMint,
          accountRentExempt,
          wallet,
          safetyDeposit,
          signers,
          instructions,
        );
        break;
    }
  }

  const eligibleForOpenEdition =
    (winnerIndex == null &&
      auctionView.auctionManager.info.settings
        .openEditionNonWinningConstraint !=
        NonWinningConstraint.NoOpenEdition) ||
    (winnerIndex != null &&
      auctionView.auctionManager.info.settings.openEditionWinnerConstraint !=
        WinningConstraint.NoOpenEdition);

  if (auctionView.openEditionItem && eligibleForOpenEdition) {
    const item = auctionView.openEditionItem;
    const safetyDeposit = item.safetyDeposit;
    await setupRedeemOpenInstructions(
      auctionView,
      accountsByMint,
      accountRentExempt,
      mintRentExempt,
      wallet,
      safetyDeposit,
      item,
      signers,
      instructions,
    );
  }

  if (signers.length == 1)
    await sendTransactionWithRetry(
      connection,
      wallet,
      instructions[0],
      signers[0],
      'single',
    );
  else
    await sendTransactions(
      connection,
      wallet,
      instructions,
      signers,
      SequenceType.StopOnFailure,
      'single',
    );
}

async function setupRedeemInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  wallet: WalletSigner,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  signers: Array<Account[]>,
  instructions: Array<TransactionInstruction[]>,
) {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  let winningPrizeSigner: Account[] = [];
  let winningPrizeInstructions: TransactionInstruction[] = [];

  signers.push(winningPrizeSigner);
  instructions.push(winningPrizeInstructions);
  if (auctionView.myBidderMetadata) {
    let newTokenAccount = accountsByMint.get(
      safetyDeposit.info.tokenMint.toBase58(),
    )?.pubkey;
    if (!newTokenAccount)
      newTokenAccount = createTokenAccount(
        winningPrizeInstructions,
        wallet.publicKey,
        accountRentExempt,
        safetyDeposit.info.tokenMint,
        wallet.publicKey,
        winningPrizeSigner,
      );

    await redeemBid(
      auctionView.auctionManager.info.vault,
      safetyDeposit.info.store,
      newTokenAccount,
      safetyDeposit.pubkey,
      auctionView.vault.info.fractionMint,
      auctionView.myBidderMetadata.info.bidderPubkey,
      wallet.publicKey,
      winningPrizeInstructions,
    );
  }
}

async function setupRedeemMasterInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  wallet: WalletSigner,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  item: AuctionViewItem,
  signers: Array<Account[]>,
  instructions: Array<TransactionInstruction[]>,
) {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  let winningPrizeSigner: Account[] = [];
  let winningPrizeInstructions: TransactionInstruction[] = [];

  signers.push(winningPrizeSigner);
  instructions.push(winningPrizeInstructions);
  if (auctionView.myBidderMetadata) {
    let newTokenAccount = accountsByMint.get(
      safetyDeposit.info.tokenMint.toBase58(),
    )?.pubkey;
    if (!newTokenAccount)
      newTokenAccount = createTokenAccount(
        winningPrizeInstructions,
        wallet.publicKey,
        accountRentExempt,
        safetyDeposit.info.tokenMint,
        wallet.publicKey,
        winningPrizeSigner,
      );

    await redeemMasterEditionBid(
      auctionView.auctionManager.info.vault,
      safetyDeposit.info.store,
      newTokenAccount,
      safetyDeposit.pubkey,
      auctionView.vault.info.fractionMint,
      auctionView.myBidderMetadata.info.bidderPubkey,
      wallet.publicKey,
      winningPrizeInstructions,
      item.metadata.pubkey,
      await getNameSymbol(item.metadata.info),
      wallet.publicKey,
    );
  }
}

async function setupRedeemLimitedInstructions(
  connection: Connection,
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  mintRentExempt: number,
  wallet: WalletSigner,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  item: AuctionViewItem,
  signers: Array<Account[]>,
  instructions: Array<TransactionInstruction[]>,
  winningConfig: WinningConfig,
) {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const updateAuth =
    item.metadata.info.nonUniqueSpecificUpdateAuthority ||
    item.nameSymbol?.info.updateAuthority;
  console.log(
    'item',
    item,
    item.metadata.info.mint.toBase58(),
    item.metadata.info.masterEdition?.toBase58(),
  );
  if (item.masterEdition && updateAuth && auctionView.myBidderMetadata) {
    let newTokenAccount: PublicKey | undefined = accountsByMint.get(
      item.masterEdition.info.masterMint.toBase58(),
    )?.pubkey;

    if (!auctionView.myBidRedemption?.info.bidRedeemed) {
      let winningPrizeSigner: Account[] = [];
      let winningPrizeInstructions: TransactionInstruction[] = [];

      signers.push(winningPrizeSigner);
      instructions.push(winningPrizeInstructions);
      if (!newTokenAccount)
        newTokenAccount = createTokenAccount(
          winningPrizeInstructions,
          wallet.publicKey,
          accountRentExempt,
          item.masterEdition.info.masterMint,
          wallet.publicKey,
          winningPrizeSigner,
        );
      const originalAuthorityAcct = await connection.getAccountInfo(
        await getOriginalAuthority(
          auctionView.auction.pubkey,
          item.metadata.pubkey,
        ),
      );
      console.log('Original auth', originalAuthorityAcct);
      if (originalAuthorityAcct) {
        const originalAuthority = new PublicKey(
          originalAuthorityAcct.data.slice(1, 33),
        );

        await redeemLimitedEditionBid(
          auctionView.auctionManager.info.vault,
          safetyDeposit.info.store,
          newTokenAccount,
          safetyDeposit.pubkey,
          auctionView.vault.info.fractionMint,
          auctionView.myBidderMetadata.info.bidderPubkey,
          wallet.publicKey,
          winningPrizeInstructions,
          originalAuthority,
          item.metadata.info.mint,
          item.masterEdition.info.masterMint,
        );
      }

      for (let i = 0; i < winningConfig.amount; i++) {
        let cashInLimitedPrizeAuthorizationTokenSigner: Account[] = [];
        let cashInLimitedPrizeAuthorizationTokenInstruction: TransactionInstruction[] = [];
        signers.push(cashInLimitedPrizeAuthorizationTokenSigner);
        instructions.push(cashInLimitedPrizeAuthorizationTokenInstruction);

        const newLimitedEditionMint = createMint(
          cashInLimitedPrizeAuthorizationTokenInstruction,
          wallet.publicKey,
          mintRentExempt,
          0,
          wallet.publicKey,
          wallet.publicKey,
          cashInLimitedPrizeAuthorizationTokenSigner,
        );
        const newLimitedEdition = createTokenAccount(
          cashInLimitedPrizeAuthorizationTokenInstruction,
          wallet.publicKey,
          accountRentExempt,
          newLimitedEditionMint,
          wallet.publicKey,
          cashInLimitedPrizeAuthorizationTokenSigner,
        );

        cashInLimitedPrizeAuthorizationTokenInstruction.push(
          Token.createMintToInstruction(
            programIds().token,
            newLimitedEditionMint,
            newLimitedEdition,
            wallet.publicKey,
            [],
            1,
          ),
        );

        const burnAuthority = approve(
          cashInLimitedPrizeAuthorizationTokenInstruction,
          [],
          newTokenAccount,
          wallet.publicKey,
          1,
        );

        cashInLimitedPrizeAuthorizationTokenSigner.push(burnAuthority);

        mintNewEditionFromMasterEditionViaToken(
          newLimitedEditionMint,
          item.metadata.info.mint,
          wallet.publicKey,
          item.masterEdition.info.masterMint,
          newTokenAccount,
          burnAuthority.publicKey,
          updateAuth,
          cashInLimitedPrizeAuthorizationTokenInstruction,
          wallet.publicKey,
        );
      }
    }
  }
}

async function setupRedeemOpenInstructions(
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  mintRentExempt: number,
  wallet: WalletSigner,
  safetyDeposit: ParsedAccount<SafetyDepositBox>,
  item: AuctionViewItem,
  signers: Array<Account[]>,
  instructions: Array<TransactionInstruction[]>,
) {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const updateAuth =
    item.metadata.info.nonUniqueSpecificUpdateAuthority ||
    item.nameSymbol?.info.updateAuthority;
  if (item.masterEdition && updateAuth && auctionView.myBidderMetadata) {
    let newTokenAccount: PublicKey | undefined = accountsByMint.get(
      item.masterEdition.info.masterMint.toBase58(),
    )?.pubkey;

    if (!auctionView.myBidRedemption?.info.bidRedeemed) {
      let winningPrizeSigner: Account[] = [];
      let winningPrizeInstructions: TransactionInstruction[] = [];

      signers.push(winningPrizeSigner);
      instructions.push(winningPrizeInstructions);
      if (!newTokenAccount)
        newTokenAccount = createTokenAccount(
          winningPrizeInstructions,
          wallet.publicKey,
          accountRentExempt,
          item.masterEdition.info.masterMint,
          wallet.publicKey,
          winningPrizeSigner,
        );

      const transferAuthority = approve(
        winningPrizeInstructions,
        [],
        auctionView.myBidderMetadata.info.bidderPubkey,
        wallet.publicKey,
        auctionView.auctionManager.info.settings.openEditionFixedPrice?.toNumber() ||
          0,
      );

      winningPrizeSigner.push(transferAuthority);

      await redeemOpenEditionBid(
        auctionView.auctionManager.info.vault,
        safetyDeposit.info.store,
        newTokenAccount,
        safetyDeposit.pubkey,
        auctionView.vault.info.fractionMint,
        auctionView.myBidderMetadata.info.bidderPubkey,
        wallet.publicKey,
        winningPrizeInstructions,
        item.metadata.info.mint,
        item.masterEdition.info.masterMint,
        transferAuthority.publicKey,
        auctionView.auctionManager.info.acceptPayment,
      );
    }

    if (newTokenAccount) {
      let cashInOpenPrizeAuthorizationTokenSigner: Account[] = [];
      let cashInOpenPrizeAuthorizationTokenInstruction: TransactionInstruction[] = [];
      signers.push(cashInOpenPrizeAuthorizationTokenSigner);
      instructions.push(cashInOpenPrizeAuthorizationTokenInstruction);

      const newOpenEditionMint = createMint(
        cashInOpenPrizeAuthorizationTokenInstruction,
        wallet.publicKey,
        mintRentExempt,
        0,
        wallet.publicKey,
        wallet.publicKey,
        cashInOpenPrizeAuthorizationTokenSigner,
      );
      const newOpenEdition = createTokenAccount(
        cashInOpenPrizeAuthorizationTokenInstruction,
        wallet.publicKey,
        accountRentExempt,
        newOpenEditionMint,
        wallet.publicKey,
        cashInOpenPrizeAuthorizationTokenSigner,
      );

      cashInOpenPrizeAuthorizationTokenInstruction.push(
        Token.createMintToInstruction(
          programIds().token,
          newOpenEditionMint,
          newOpenEdition,
          wallet.publicKey,
          [],
          1,
        ),
      );

      const burnAuthority = approve(
        cashInOpenPrizeAuthorizationTokenInstruction,
        [],
        newTokenAccount,
        wallet.publicKey,
        1,
      );

      cashInOpenPrizeAuthorizationTokenSigner.push(burnAuthority);

      await mintNewEditionFromMasterEditionViaToken(
        newOpenEditionMint,
        item.metadata.info.mint,
        wallet.publicKey,
        item.masterEdition.info.masterMint,
        newTokenAccount,
        burnAuthority.publicKey,
        updateAuth,
        cashInOpenPrizeAuthorizationTokenInstruction,
        wallet.publicKey,
      );
    }
  }
}
