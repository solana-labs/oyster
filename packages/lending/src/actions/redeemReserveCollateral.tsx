import {
  contexts,
  findOrCreateAccountByMint,
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
  redeemReserveCollateralInstruction,
  refreshReserveInstruction,
  Reserve,
} from '../models';

const { approve } = models;
const { sendTransaction } = contexts.Connection;

// @FIXME
export const redeemReserveCollateral = async (
  connection: Connection,
  wallet: any,
  collateralAmount: number,
  source: TokenAccount,
  reserve: Reserve,
  reserveAddress: PublicKey,
) => {
  notify({
    message: 'Withdrawing funds...',
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
    [reserve.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

  const sourceCollateral = source.pubkey;

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    sourceCollateral,
    wallet.publicKey,
    collateralAmount,
  );

  signers.push(transferAuthority);

  // get destination account
  const destinationLiquidity = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    reserve.liquidity.mintPubkey,
    signers,
  );

  instructions.push(
    refreshReserveInstruction(
      reserveAddress,
      reserve.liquidity.oracleOption
        ? reserve.liquidity.oraclePubkey
        : undefined,
    ),
    redeemReserveCollateralInstruction(
      collateralAmount,
      sourceCollateral,
      destinationLiquidity,
      reserveAddress,
      reserve.collateral.mintPubkey,
      reserve.liquidity.supplyPubkey,
      reserve.lendingMarket,
      lendingMarketAuthority,
      transferAuthority.publicKey,
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
      message: 'Funds deposited.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch {
    // TODO:
  }
};
