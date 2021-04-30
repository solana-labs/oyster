import {
  contexts,
  createTempMemoryAccount,
  ensureSplAccount,
  findOrCreateAccountByMint,
  LENDING_PROGRAM_ID,
  models,
  notify,
  ParsedAccount,
  TokenAccount,
} from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  LendingMarket,
  liquidateObligationInstruction,
  Obligation,
  refreshReserveInstruction,
  Reserve,
} from '../models';

const { cache } = contexts.Accounts;
const { approve } = models;
const { sendTransaction } = contexts.Connection;

// @FIXME
export const liquidateObligation = async (
  connection: Connection,
  wallet: any,
  liquidityAmount: number,
  source: TokenAccount,
  repayReserve: ParsedAccount<Reserve>,
  withdrawReserve: ParsedAccount<Reserve>,
  obligation: ParsedAccount<Obligation>,
) => {
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

  const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
    [repayReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

  const sourceAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    source,
    wallet.publicKey,
    liquidityAmount + accountRentExempt,
    signers,
  );

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    sourceAccount,
    wallet.publicKey,
    liquidityAmount,
  );
  signers.push(transferAuthority);

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    withdrawReserve.info.collateral.mintPubkey,
    signers,
  );

  // @FIXME: oracle
  const oracleAddress = repayReserve.info.liquidity.oracleOption
    ? repayReserve.info.liquidity.oraclePubkey
    : withdrawReserve.info.liquidity.oraclePubkey;
  const oracle = cache.get(oracleAddress);

  if (!oracle) {
    throw new Error(`Dex market doesn't exist.`);
  }

  const market = cache.get(
    withdrawReserve.info.lendingMarket,
  ) as ParsedAccount<LendingMarket>;

  const dexOrderBookSide = market.info.quoteTokenMint.equals(
    repayReserve.info.liquidity.mintPubkey,
  )
    ? oracle?.info.asks
    : oracle?.info.bids;

  const memory = createTempMemoryAccount(
    instructions,
    wallet.publicKey,
    signers,
    LENDING_PROGRAM_ID,
  );

  instructions.push(
    // @FIXME: oracle needed
    refreshReserveInstruction(repayReserve.pubkey),
    refreshReserveInstruction(withdrawReserve.pubkey),
  );

  instructions.push(
    liquidateObligationInstruction(
      liquidityAmount,
      sourceAccount,
      toAccount,
      repayReserve.pubkey,
      repayReserve.info.liquidity.supplyPubkey,
      withdrawReserve.pubkey,
      withdrawReserve.info.collateral.supplyPubkey,
      obligation.pubkey,
      repayReserve.info.lendingMarket,
      lendingMarketAuthority,
      transferAuthority.publicKey,
    ),
  );

  let { txid } = await sendTransaction(
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
