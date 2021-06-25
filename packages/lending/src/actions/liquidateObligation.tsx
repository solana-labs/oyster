import {
  ensureSplAccount,
  findOrCreateAccountByMint,
  LENDING_PROGRAM_ID,
  models,
  notify,
  ParsedAccount,
  sendTransaction,
  TokenAccount,
} from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { liquidateObligationInstruction, Obligation, Reserve } from '../models';
import { refreshObligationAndReserves } from './helpers/refreshObligationAndReserves';

const { approve } = models;

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
    message: 'Liquidating obligation...',
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

  instructions.push(
    ...await refreshObligationAndReserves(connection, obligation),
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
    message: 'Obligation liquidated.',
    type: 'success',
    description: `Transaction - ${txid}`,
  });
};
