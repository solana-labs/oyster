import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  actions,
  Metadata,
  ParsedAccount,
  WinnerLimit,
  MasterEdition,
  NameSymbolTuple,
  getMetadata,
  SequenceType,
  sendTransactions,
  getSafetyDepositBox,
  Edition,
  getEdition,
} from '@oyster/common';

import { AccountLayout } from '@solana/spl-token';
import BN from 'bn.js';
import {
  AuctionManagerSettings,
  EditionType,
  getAuctionKeys,
  initAuctionManager,
  startAuction,
  validateSafetyDepositBox,
  WinningConfig,
} from '../models/metaplex';
import { createVault } from './createVault';
import { closeVault } from './closeVault';
import {
  addTokensToVault,
  SafetyDepositInstructionConfig,
} from './addTokensToVault';
import { makeAuction } from './makeAuction';
import { createExternalPriceAccount } from './createExternalPriceAccount';
const { createTokenAccount } = actions;

interface normalPattern {
  instructions: TransactionInstruction[];
  signers: Account[];
}
interface byType {
  addTokens: {
    instructions: Array<TransactionInstruction[]>;
    signers: Array<Account[]>;
  };
  validateBoxes: {
    instructions: Array<TransactionInstruction[]>;
    signers: Array<Account[]>;
  };
  createVault: normalPattern;
  closeVault: normalPattern;
  makeAuction: normalPattern;
  initAuctionManager: normalPattern;
  startAuction: normalPattern;
  externalPriceAccount: normalPattern;
}

export interface SafetyDepositDraft {
  metadata: ParsedAccount<Metadata>;
  nameSymbol?: ParsedAccount<NameSymbolTuple>;
  masterEdition?: ParsedAccount<MasterEdition>;
  edition?: ParsedAccount<Edition>;
  holding: PublicKey;
  masterMintHolding?: PublicKey;
}

// This is a super command that executes many transactions to create a Vault, Auction, and AuctionManager starting
// from some AuctionManagerSettings.
export async function createAuctionManager(
  connection: Connection,
  wallet: any,
  settings: AuctionManagerSettings,
  winnerLimit: WinnerLimit,
  endAuctionAt: BN,
  auctionGap: BN,
  safetyDepositDrafts: SafetyDepositDraft[],
  openEditionSafetyDepositDraft: SafetyDepositDraft | undefined,
  paymentMint: PublicKey,
): Promise<{
  vault: PublicKey;
  auction: PublicKey;
  auctionManager: PublicKey;
}> {
  const {
    externalPriceAccount,
    priceMint,
    instructions: epaInstructions,
    signers: epaSigners,
  } = await createExternalPriceAccount(connection, wallet);

  const {
    instructions: createVaultInstructions,
    signers: createVaultSigners,
    vault,
    fractionalMint,
    redeemTreasury,
    fractionTreasury,
  } = await createVault(connection, wallet, priceMint, externalPriceAccount);

  const {
    instructions: makeAuctionInstructions,
    signers: makeAuctionSigners,
    auction,
  } = await makeAuction(
    wallet,
    winnerLimit,
    vault,
    endAuctionAt,
    auctionGap,
    paymentMint,
  );

  let safetyDepositConfigs = buildSafetyDepositArray(
    safetyDepositDrafts,
    openEditionSafetyDepositDraft,
    settings.winningConfigs,
  );

  const {
    instructions: auctionManagerInstructions,
    signers: auctionManagerSigners,
    auctionManager,
  } = await setupAuctionManagerInstructions(
    connection,
    wallet,
    vault,
    paymentMint,
    settings,
    openEditionSafetyDepositDraft,
  );

  const {
    instructions: addTokenInstructions,
    signers: addTokenSigners,
    stores,
  } = await addTokensToVault(connection, wallet, vault, safetyDepositConfigs);

  let lookup: byType = {
    externalPriceAccount: {
      instructions: epaInstructions,
      signers: epaSigners,
    },
    createVault: {
      instructions: createVaultInstructions,
      signers: createVaultSigners,
    },
    closeVault: await closeVault(
      connection,
      wallet,
      vault,
      fractionalMint,
      fractionTreasury,
      redeemTreasury,
      priceMint,
      externalPriceAccount,
    ),
    addTokens: { instructions: addTokenInstructions, signers: addTokenSigners },
    makeAuction: {
      instructions: makeAuctionInstructions,
      signers: makeAuctionSigners,
    },
    initAuctionManager: {
      instructions: auctionManagerInstructions,
      signers: auctionManagerSigners,
    },
    startAuction: await setupStartAuction(wallet, vault),
    validateBoxes: await validateBoxes(
      wallet,
      vault,
      // No need to validate open edition, it's already been during init, or if not present, let all in
      safetyDepositConfigs.filter(
        c =>
          !openEditionSafetyDepositDraft ||
          c.draft.metadata.pubkey.toBase58() !=
            openEditionSafetyDepositDraft.metadata.pubkey.toBase58(),
      ),
      stores,
      settings,
    ),
  };

  console.log('Lookup', lookup.validateBoxes);
  let signers: Account[][] = [
    lookup.externalPriceAccount.signers,
    lookup.createVault.signers,
    ...lookup.addTokens.signers,
    lookup.closeVault.signers,
    lookup.makeAuction.signers,
    lookup.initAuctionManager.signers,
    ...lookup.validateBoxes.signers,
    lookup.startAuction.signers,
  ];
  let instructions: TransactionInstruction[][] = [
    lookup.externalPriceAccount.instructions,
    lookup.createVault.instructions,
    ...lookup.addTokens.instructions,
    lookup.closeVault.instructions,
    lookup.makeAuction.instructions,
    lookup.initAuctionManager.instructions,
    ...lookup.validateBoxes.instructions,
    lookup.startAuction.instructions,
  ];

  let stopPoint = 0;
  while (stopPoint < instructions.length) {
    stopPoint = await sendTransactions(
      connection,
      wallet,
      instructions,
      signers,
      SequenceType.StopOnFailure,
      'max',
    );
  }

  return { vault, auction, auctionManager };
}

function buildSafetyDepositArray(
  safetyDeposits: SafetyDepositDraft[],
  openEditionSafetyDepositDraft: SafetyDepositDraft | undefined,
  winningConfigs: WinningConfig[],
): SafetyDepositInstructionConfig[] {
  let safetyDepositConfig: SafetyDepositInstructionConfig[] = [];
  safetyDeposits.forEach((w, i) => {
    let winningConfigsThatShareThisBox = winningConfigs.filter(
      ow => ow.safetyDepositBoxIndex == i,
    );

    // Configs where we are selling this safety deposit as a master edition or single nft
    let nonLimitedEditionConfigs = winningConfigsThatShareThisBox.filter(
      ow => ow.editionType != EditionType.LimitedEdition,
    );
    // we may also have an auction where we are selling prints of the master too as secondary prizes
    let limitedEditionConfigs = winningConfigsThatShareThisBox.filter(
      ow => ow.editionType == EditionType.LimitedEdition,
    );

    const nonLimitedEditionTotal = nonLimitedEditionConfigs
      .map(ow => ow.amount)
      .reduce((sum, acc) => (sum += acc), 0);
    const limitedEditionTotal = limitedEditionConfigs
      .map(ow => ow.amount)
      .reduce((sum, acc) => (sum += acc), 0);

    if (nonLimitedEditionTotal > 0) {
      safetyDepositConfig.push({
        tokenAccount: w.holding,
        tokenMint: w.metadata.info.mint,
        amount: new BN(nonLimitedEditionTotal),
        draft: w,
      });
    }

    if (
      limitedEditionTotal > 0 &&
      w.masterEdition?.info.masterMint &&
      w.masterMintHolding
    ) {
      safetyDepositConfig.push({
        tokenAccount: w.masterMintHolding,
        tokenMint: w.masterEdition?.info.masterMint,
        amount: new BN(limitedEditionTotal),
        draft: w,
      });
    }
  });

  if (openEditionSafetyDepositDraft) {
    safetyDepositConfig.push({
      tokenAccount: openEditionSafetyDepositDraft.holding,
      tokenMint: openEditionSafetyDepositDraft.metadata.info.mint,
      amount: new BN(1),
      draft: openEditionSafetyDepositDraft,
    });
  }

  return safetyDepositConfig;
}

async function setupAuctionManagerInstructions(
  connection: Connection,
  wallet: any,
  vault: PublicKey,
  paymentMint: PublicKey,
  settings: AuctionManagerSettings,
  openEditionSafetyDepositDraft?: SafetyDepositDraft,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Account[];
  auctionManager: PublicKey;
}> {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const { auctionManagerKey } = await getAuctionKeys(vault);

  const acceptPayment = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    paymentMint,
    auctionManagerKey,
    signers,
  );

  await initAuctionManager(
    vault,
    openEditionSafetyDepositDraft?.metadata.pubkey,
    openEditionSafetyDepositDraft?.nameSymbol?.pubkey,
    wallet.publicKey,
    openEditionSafetyDepositDraft?.masterEdition?.pubkey,
    openEditionSafetyDepositDraft?.metadata.info.mint,
    openEditionSafetyDepositDraft?.masterEdition?.info.masterMint,
    wallet.publicKey,
    wallet.publicKey,
    wallet.publicKey,
    acceptPayment,
    settings,
    instructions,
  );

  return { instructions, signers, auctionManager: auctionManagerKey };
}

async function setupStartAuction(
  wallet: any,
  vault: PublicKey,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Account[];
}> {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  await startAuction(vault, wallet.publicKey, instructions);

  return { instructions, signers };
}

async function validateBoxes(
  wallet: any,
  vault: PublicKey,
  safetyDeposits: SafetyDepositInstructionConfig[],
  stores: PublicKey[],
  settings: AuctionManagerSettings,
): Promise<{
  instructions: TransactionInstruction[][];
  signers: Account[][];
}> {
  let signers: Account[][] = [];
  let instructions: TransactionInstruction[][] = [];

  for (let i = 0; i < safetyDeposits.length; i++) {
    let tokenSigners: Account[] = [];
    let tokenInstructions: TransactionInstruction[] = [];

    let safetyDepositBox: PublicKey;

    let winningConfig = settings.winningConfigs.find(
      ow => ow.safetyDepositBoxIndex == i,
    );

    if (winningConfig) {
      if (
        winningConfig.editionType == EditionType.LimitedEdition &&
        safetyDeposits[i].draft.masterEdition &&
        safetyDeposits[i].draft.masterEdition?.info.masterMint
      )
        safetyDepositBox = await getSafetyDepositBox(
          vault,
          //@ts-ignore
          safetyDeposits[i].draft.masterEdition.info.masterMint,
        );
      else
        safetyDepositBox = await getSafetyDepositBox(
          vault,
          safetyDeposits[i].draft.metadata.info.mint,
        );
      const edition: PublicKey = await getEdition(
        safetyDeposits[i].draft.metadata.info.mint,
      );

      await validateSafetyDepositBox(
        vault,
        safetyDeposits[i].draft.metadata.pubkey,
        safetyDeposits[i].draft.nameSymbol?.pubkey,
        safetyDepositBox,
        stores[i],
        //@ts-ignore
        winningConfig.editionType == EditionType.LimitedEdition
          ? safetyDeposits[i].draft.masterEdition?.info.masterMint
          : safetyDeposits[i].draft.metadata.info.mint,
        wallet.publicKey,
        wallet.publicKey,
        wallet.publicKey,
        tokenInstructions,
        edition,
        safetyDeposits[i].draft.masterEdition?.info.masterMint,
        safetyDeposits[i].draft.masterEdition ? wallet.publicKey : undefined,
      );
    }
    signers.push(tokenSigners);
    instructions.push(tokenInstructions);
  }
  return { instructions, signers };
}
