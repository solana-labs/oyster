import {
  actions,
  contexts,
  LENDING_PROGRAM_ID,
  models,
  notify,
  TokenAccount,
} from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { initReserveInstruction, Reserve } from '../models';

const { sendTransaction } = contexts.Connection;
const {
  createUninitializedAccount,
  ensureSplAccount,
} = actions;
const { approve } = models;

export const initReserve = async (
  connection: Connection,
  // @FIXME: wallet must be lending market owner
  wallet: any,
  liquidityAmount: number,
  source: TokenAccount,
  reserve: Reserve,
  reserveAddress: PublicKey,
) => {
  notify({
    message: 'Initializing reserve...',
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
    [reserve.lendingMarket.toBuffer()], // which account should be authority
    LENDING_PROGRAM_ID,
  );

  const sourceLiquidityAccount = ensureSplAccount(
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
    sourceLiquidityAccount,
    wallet.publicKey,
    liquidityAmount,
  );

  signers.push(transferAuthority);

  let destinationCollateralAccount: PublicKey = createUninitializedAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    signers,
  );

  instructions.push(
    initReserveInstruction(
      liquidityAmount,
      reserve.config,
      sourceLiquidityAccount,
      destinationCollateralAccount,
      reserveAddress,
      reserve.liquidity.mintPubkey,
      reserve.liquidity.supplyPubkey,
      reserve.liquidity.feeReceiver,
      reserve.collateral.mintPubkey,
      reserve.collateral.supplyPubkey,
      reserve.lendingMarket,
      lendingMarketAuthority,
      // @FIXME: need to sign with wallet as lending market owner
      wallet.publicKey,
      transferAuthority.publicKey,
      reserve.liquidity.oracleOption
        ? reserve.liquidity.oraclePubkey
        : undefined,
    ),
  );

  try {
    let { txid } = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true,
    );

    notify({
      message: 'Reserve initialized.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch {
    // TODO:
    throw new Error();
  }
};
