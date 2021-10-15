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
  ParsedAccount,
  TokenAccount,
  WalletSigner,
  WalletNotConnectedError,
} from '@oyster/common';
import {
  accrueInterestInstruction,
  LendingReserve,
} from './../models/lending/reserve';
import { liquidateInstruction } from './../models/lending/liquidate';
import { AccountLayout } from '@solana/spl-token';
import { LendingMarket, LendingObligation } from '../models';

const { cache } = contexts.Accounts;
const { approve } = models;
const {
  createTempMemoryAccount,
  ensureSplAccount,
  findOrCreateAccountByMint,
} = actions;
const { sendTransaction } = contexts.Connection;
const { LENDING_PROGRAM_ID, notify } = utils;

export const liquidate = async (
  connection: Connection,
  wallet: WalletSigner,
  from: TokenAccount, // liquidity account
  amountLamports: number, // in liquidty token (lamports)

  // which loan to repay
  obligation: ParsedAccount<LendingObligation>,

  repayReserve: ParsedAccount<LendingReserve>,

  withdrawReserve: ParsedAccount<LendingReserve>,
) => {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  notify({
    message: 'Repaying funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const [authority] = await PublicKey.findProgramAddress(
    [repayReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

  const fromAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    from,
    wallet.publicKey,
    amountLamports + accountRentExempt,
    signers,
  );

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    fromAccount,
    wallet.publicKey,
    amountLamports,
  );
  signers.push(transferAuthority);

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    withdrawReserve.info.collateralMint,
    signers,
  );

  const dexMarketAddress = repayReserve.info.dexMarketOption
    ? repayReserve.info.dexMarket
    : withdrawReserve.info.dexMarket;
  const dexMarket = cache.get(dexMarketAddress);

  if (!dexMarket) {
    throw new Error(`Dex market doesn't exist.`);
  }

  const market = cache.get(
    withdrawReserve.info.lendingMarket,
  ) as ParsedAccount<LendingMarket>;

  const dexOrderBookSide = market.info.quoteMint.equals(
    repayReserve.info.liquidityMint,
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
    accrueInterestInstruction(repayReserve.pubkey, withdrawReserve.pubkey),
  );

  instructions.push(
    liquidateInstruction(
      amountLamports,
      fromAccount,
      toAccount,
      repayReserve.pubkey,
      repayReserve.info.liquiditySupply,
      withdrawReserve.pubkey,
      withdrawReserve.info.collateralSupply,
      obligation.pubkey,
      repayReserve.info.lendingMarket,
      authority,
      transferAuthority.publicKey,
      dexMarketAddress,
      dexOrderBookSide,
      memory,
    ),
  );

  let { txid }  = await sendTransaction(
    connection,
    wallet,
    instructions.concat(cleanupInstructions),
    signers,
    true,
  );

  notify({
    message: 'Funds liquidated.',
    type: 'success',
    description: `Transaction - ${txid}`,
  });
};
