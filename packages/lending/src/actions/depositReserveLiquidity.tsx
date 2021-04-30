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
import {
  depositReserveLiquidityInstruction,
  initReserveInstruction,
  refreshReserveInstruction,
  Reserve,
} from '../models';

const { sendTransaction } = contexts.Connection;
const {
  createUninitializedAccount,
  ensureSplAccount,
  findOrCreateAccountByMint,
} = actions;
const { approve } = models;

// @FIXME: split up into deposit, and init which requires lending market owner
export const depositReserveLiquidity = async (
  connection: Connection,
  wallet: any,
  liquidityAmount: number,
  source: TokenAccount,
  reserve: Reserve,
  reserveAddress: PublicKey,
) => {
  notify({
    message: 'Depositing funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  const isInitalized = true; // TODO: finish reserve init

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

  let destinationCollateralAccount: PublicKey = isInitalized
    ? await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        reserve.collateral.mintPubkey,
        signers,
      )
    : createUninitializedAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        signers,
      );

  if (isInitalized) {
    instructions.push(
      refreshReserveInstruction(
        reserveAddress,
        reserve.liquidity.oracleOption
          ? reserve.liquidity.oraclePubkey
          : undefined,
      ),
      depositReserveLiquidityInstruction(
        liquidityAmount,
        sourceLiquidityAccount,
        destinationCollateralAccount,
        reserveAddress,
        reserve.liquidity.supplyPubkey,
        reserve.collateral.mintPubkey,
        reserve.lendingMarket,
        lendingMarketAuthority,
        transferAuthority.publicKey,
      ),
    );
  } else {
    // TODO: finish reserve init
    // @FIXME: reserve config
    const MAX_UTILIZATION_RATE = 80;
    instructions.push(
      initReserveInstruction(
        liquidityAmount,
        MAX_UTILIZATION_RATE,
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
        // @FIXME: lending market owner
        lendingMarketOwner,
        transferAuthority.publicKey,
        reserve.liquidity.oracleOption
          ? reserve.liquidity.oraclePubkey
          : undefined,
      ),
    );
  }

  try {
    let { txid } = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true,
    );

    notify({
      message: 'Funds deposited.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch {
    // TODO:
    throw new Error();
  }
};
