import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  contexts,
  utils,
  actions,
  models,
  TokenAccount,
  ParsedAccount,
  WalletSigner,
  WalletNotConnectedError,
} from '@oyster/common';
import {
  accrueInterestInstruction,
  LendingReserve,
} from './../models/lending/reserve';
import { AccountLayout, MintInfo, MintLayout } from '@solana/spl-token';
import { createUninitializedObligation } from './obligation';
import {
  LendingObligationLayout,
  borrowInstruction,
  LendingMarket,
  BorrowAmountType,
  LendingObligation,
  initObligationInstruction,
} from '../models';

const { approve } = models;
const { toLamports, LENDING_PROGRAM_ID, LEND_HOST_FEE_ADDRESS, notify } = utils;
const { cache, MintParser } = contexts.Accounts;
const { sendTransaction } = contexts.Connection;
const {
  createTempMemoryAccount,
  createUninitializedAccount,
  createUninitializedMint,
  ensureSplAccount,
  findOrCreateAccountByMint,
} = actions;

export const borrow = async (
  connection: Connection,
  wallet: WalletSigner,

  from: TokenAccount,
  amount: number,
  amountType: BorrowAmountType,

  borrowReserve: ParsedAccount<LendingReserve>,

  depositReserve: ParsedAccount<LendingReserve>,

  existingObligation?: ParsedAccount<LendingObligation>,

  obligationAccount?: PublicKey,
) => {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  notify({
    message: 'Borrowing funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
  let cleanupInstructions: TransactionInstruction[] = [];
  let finalCleanupInstructions: TransactionInstruction[] = [];

  const [authority] = await PublicKey.findProgramAddress(
    [depositReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const obligation = existingObligation
    ? existingObligation.pubkey
    : createUninitializedObligation(
        instructions,
        wallet.publicKey,
        await connection.getMinimumBalanceForRentExemption(
          LendingObligationLayout.span,
        ),
        signers,
      );

  const obligationMint = existingObligation
    ? existingObligation.info.tokenMint
    : createUninitializedMint(
        instructions,
        wallet.publicKey,
        await connection.getMinimumBalanceForRentExemption(MintLayout.span),
        signers,
      );

  const obligationTokenOutput = obligationAccount
    ? obligationAccount
    : createUninitializedAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        signers,
      );

  if (!obligationAccount) {
    instructions.push(
      initObligationInstruction(
        depositReserve.pubkey,
        borrowReserve.pubkey,
        obligation,
        obligationMint,
        obligationTokenOutput,
        wallet.publicKey,
        depositReserve.info.lendingMarket,
        authority,
      ),
    );
  }

  // Creates host fee account if it doesn't exsist
  let hostFeeReceiver = LEND_HOST_FEE_ADDRESS
    ? findOrCreateAccountByMint(
        wallet.publicKey,
        LEND_HOST_FEE_ADDRESS,
        instructions,
        [],
        accountRentExempt,
        depositReserve.info.collateralMint,
        signers,
      )
    : undefined;

  let amountLamports: number = 0;
  let fromLamports: number = 0;
  if (amountType === BorrowAmountType.LiquidityBorrowAmount) {
    // approve max transfer
    // TODO: improve contrain by using dex market data
    const approvedAmount = from.info.amount.toNumber();

    fromLamports = approvedAmount - accountRentExempt;

    const mint = (await cache.query(
      connection,
      borrowReserve.info.liquidityMint,
      MintParser,
    )) as ParsedAccount<MintInfo>;

    amountLamports = toLamports(amount, mint?.info);
  } else if (amountType === BorrowAmountType.CollateralDepositAmount) {
    const mint = (await cache.query(
      connection,
      depositReserve.info.collateralMint,
      MintParser,
    )) as ParsedAccount<MintInfo>;
    amountLamports = toLamports(amount, mint?.info);
    fromLamports = amountLamports;
  }

  const fromAccount = ensureSplAccount(
    instructions,
    finalCleanupInstructions,
    from,
    wallet.publicKey,
    fromLamports + accountRentExempt,
    signers,
  );

  let toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    finalCleanupInstructions,
    accountRentExempt,
    borrowReserve.info.liquidityMint,
    signers,
  );

  if (instructions.length > 0) {
    // create all accounts in one transaction
    let { txid }  = await sendTransaction(connection, wallet, instructions, [
      ...signers,
    ]);

    notify({
      message: 'Obligation accounts created',
      description: `Transaction ${txid}`,
      type: 'success',
    });
  }

  notify({
    message: 'Borrowing funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  signers = [];
  instructions = [];
  cleanupInstructions = [...finalCleanupInstructions];

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    fromAccount,
    wallet.publicKey,
    fromLamports,
    false,
  );
  signers.push(transferAuthority);

  const dexMarketAddress = borrowReserve.info.dexMarketOption
    ? borrowReserve.info.dexMarket
    : depositReserve.info.dexMarket;
  const dexMarket = cache.get(dexMarketAddress);

  if (!dexMarket) {
    throw new Error(`Dex market doesn't exist.`);
  }

  const market = cache.get(
    depositReserve.info.lendingMarket,
  ) as ParsedAccount<LendingMarket>;
  const dexOrderBookSide = market.info.quoteMint.equals(
    depositReserve.info.liquidityMint,
  )
    ? dexMarket?.info.asks
    : dexMarket?.info.bids;

  const memory = createTempMemoryAccount(
    instructions,
    wallet.publicKey,
    signers,
    LENDING_PROGRAM_ID,
  );

  instructions.push(
    accrueInterestInstruction(depositReserve.pubkey, borrowReserve.pubkey),
  );
  // borrow
  instructions.push(
    borrowInstruction(
      amountLamports,
      amountType,
      fromAccount,
      toAccount,
      depositReserve.pubkey,
      depositReserve.info.collateralSupply,
      depositReserve.info.collateralFeesReceiver,

      borrowReserve.pubkey,
      borrowReserve.info.liquiditySupply,

      obligation,
      obligationMint,
      obligationTokenOutput,

      depositReserve.info.lendingMarket,
      authority,
      transferAuthority.publicKey,

      dexMarketAddress,
      dexOrderBookSide,

      memory,

      hostFeeReceiver,
    ),
  );
  try {
    let { txid }  = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true,
    );

    notify({
      message: 'Funds borrowed.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
