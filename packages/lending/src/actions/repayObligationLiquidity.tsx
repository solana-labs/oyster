import {
  createTokenAccount,
  models,
  notify,
  ParsedAccount,
  sendTransaction,
  TOKEN_PROGRAM_ID,
  TokenAccount,
} from '@oyster/common';
import { AccountLayout, NATIVE_MINT, Token } from '@solana/spl-token';
import {
  Account,
  Connection,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  Obligation, refreshObligationInstruction,
  refreshReserveInstruction,
  repayObligationLiquidityInstruction,
  Reserve
} from '../models';

const { approve } = models;

export const repayObligationLiquidity = async (
  connection: Connection,
  wallet: any,
  liquidityAmount: number,
  source: TokenAccount,
  repayReserve: ParsedAccount<Reserve>,
  obligation: ParsedAccount<Obligation>,
) => {
  notify({
    message: 'Repaying liquidity...',
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

  let sourceLiquidity = source.pubkey;
  if (
    wallet.publicKey.equals(sourceLiquidity) &&
    repayReserve.info.liquidity.mintPubkey.equals(NATIVE_MINT)
  ) {
    sourceLiquidity = createTokenAccount(
      instructions,
      wallet.publicKey,
      accountRentExempt + liquidityAmount,
      NATIVE_MINT,
      wallet.publicKey,
      signers,
    );
    cleanupInstructions.push(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        sourceLiquidity,
        wallet.publicKey,
        wallet.publicKey,
        [],
      ),
    );
  }

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    sourceLiquidity,
    wallet.publicKey,
    liquidityAmount,
  );

  signers.push(transferAuthority);

  instructions.push(
    // @TODO: remove after refresh of obligation + reserves on repay is no longer required
    refreshReserveInstruction(
      repayReserve.pubkey,
      repayReserve.info.liquidity.oraclePubkey,
    ),
    refreshObligationInstruction(
      obligation.pubkey,
      obligation.info.deposits.map(collateral => collateral.depositReserve),
      obligation.info.borrows.map(liquidity => liquidity.borrowReserve),
    ),
    repayObligationLiquidityInstruction(
      liquidityAmount,
      sourceLiquidity,
      repayReserve.info.liquidity.mintPubkey,
      repayReserve.pubkey,
      obligation.pubkey,
      repayReserve.info.lendingMarket,
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
    message: 'Liquidity repaid.',
    type: 'success',
    description: `Transaction - ${txid}`,
  });
};
