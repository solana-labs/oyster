import {
  contexts,
  createTokenAccount,
  LENDING_PROGRAM_ID,
  models,
  notify,
  ParsedAccount,
  TOKEN_PROGRAM_ID,
  TokenAccount,
} from '@oyster/common';
import { AccountLayout, NATIVE_MINT, Token } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  Obligation,
  refreshReserveInstruction,
  repayObligationLiquidityInstruction,
  Reserve,
} from '../models';

const { approve } = models;
const { sendTransaction } = contexts.Connection;

// @FIXME
export const repayObligationLiquidity = async (
  connection: Connection,
  wallet: any,
  liquidityAmount: number,
  source: TokenAccount,
  repayReserve: ParsedAccount<Reserve>,
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

  let sourceLiquidity = source.pubkey;
  if (
    wallet.publicKey.equals(sourceLiquidity) &&
    repayReserve.info.liquidity.mint.equals(NATIVE_MINT)
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
    refreshReserveInstruction(
      repayReserve.pubkey,
      repayReserve.info.liquidity.aggregatorOption
        ? repayReserve.info.liquidity.aggregator
        : undefined,
    ),
    repayObligationLiquidityInstruction(
      liquidityAmount,
      sourceLiquidity,
      repayReserve.info.liquidity.mint,
      repayReserve.pubkey,
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
    message: 'Funds repaid.',
    type: 'success',
    description: `Transaction - ${txid}`,
  });
};
