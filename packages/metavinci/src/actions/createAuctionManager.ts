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
  SequenceType,
  sendTransactions,
  getSafetyDepositBox,
  Edition,
} from '@oyster/common';

import { AccountLayout } from '@solana/spl-token';
import BN from 'bn.js';
import {
  AuctionManagerSettings,
  getAuctionKeys,
  getMetadata,
  initAuctionManager,
  startAuction,
  validateSafetyDepositBox,
} from '../models/metaplex';
import { createVault } from './createVault';
import { closeVault } from './closeVault';
import { addTokensToVault } from './addTokensToVault';
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
}

// This is a super command that executes many transactions to create a Vault, Auction, and AuctionManager starting
// from some AuctionManagerSettings.
export async function createAuctionManager(
  connection: Connection,
  wallet: any,
  settings: AuctionManagerSettings,
  winnerLimit: WinnerLimit,
  duration: BN,
  gap: BN,
  safetyDeposits: SafetyDepositDraft[],
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
  } = await makeAuction(wallet, winnerLimit, vault, duration, gap, paymentMint);

  let nftConfigs = safetyDeposits.map((w, i) => ({
    tokenAccount: w.holding,
    tokenMint: w.metadata.info.mint,
    amount: new BN(
      settings.winningConfigs.find(w => w.safetyDepositBoxIndex == i)?.amount ||
        1,
    ),
  }));

  let openEditionSafetyDeposit = undefined;
  if (
    settings.openEditionConfig != null &&
    settings.openEditionConfig != undefined
  ) {
    openEditionSafetyDeposit = safetyDeposits[settings.openEditionConfig];
  }

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
    openEditionSafetyDeposit,
  );

  const {
    instructions: addTokenInstructions,
    signers: addTokenSigners,
    stores,
  } = await addTokensToVault(connection, wallet, vault, nftConfigs);

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
      // No need to validate open edition, it's already been during init
      safetyDeposits.filter(
        (_, i) =>
          settings.openEditionConfig != null && i != settings.openEditionConfig,
      ),
      stores,
    ),
  };

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

async function setupAuctionManagerInstructions(
  connection: Connection,
  wallet: any,
  vault: PublicKey,
  paymentMint: PublicKey,
  settings: AuctionManagerSettings,
  openEditionSafetyDeposit?: SafetyDepositDraft,
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
    openEditionSafetyDeposit?.metadata.pubkey,
    openEditionSafetyDeposit?.nameSymbol?.pubkey,
    wallet.publicKey,
    openEditionSafetyDeposit?.masterEdition?.pubkey,
    openEditionSafetyDeposit?.metadata.info.mint,
    openEditionSafetyDeposit?.masterEdition?.info.masterMint,
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
  safetyDeposits: SafetyDepositDraft[],
  stores: PublicKey[],
): Promise<{
  instructions: TransactionInstruction[][];
  signers: Account[][];
}> {
  let signers: Account[][] = [];
  let instructions: TransactionInstruction[][] = [];

  for (let i = 0; i < safetyDeposits.length; i++) {
    let tokenSigners: Account[] = [];
    let tokenInstructions: TransactionInstruction[] = [];
    const safetyDepositBox: PublicKey = await getSafetyDepositBox(
      vault,
      safetyDeposits[i].metadata.info.mint,
    );

    await validateSafetyDepositBox(
      vault,
      safetyDeposits[i].metadata.pubkey,
      safetyDeposits[i].nameSymbol?.pubkey,
      safetyDepositBox,
      stores[i],
      safetyDeposits[i].metadata.info.mint,
      wallet.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      tokenInstructions,
      safetyDeposits[i].masterEdition?.info.masterMint,
      safetyDeposits[i].masterEdition ? wallet.publicKey : undefined,
    );

    signers.push(tokenSigners);
    instructions.push(tokenInstructions);
  }
  return { instructions, signers };
}
