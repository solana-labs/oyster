import { PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import { TOKEN_PROGRAM_ID, LENDING_PROGRAM_ID } from '../../utils/ids';
import { wadToLamports } from '../../utils/utils';
import * as Layout from './../../utils/layout';
import { LendingInstruction } from './lending';
import { LendingReserve } from './reserve';

export enum BorrowAmountType {
  LiquidityBorrowAmount = 0,
  CollateralDepositAmount = 1,
}

/// Borrow tokens from a reserve by depositing collateral tokens. The number of borrowed tokens
/// is calculated by market price. The debt obligation is tokenized.
///
///   0. `[writable]` Source collateral token account, minted by deposit reserve collateral mint,
///                     $authority can transfer $collateral_amount
///   1. `[writable]` Destination liquidity token account, minted by borrow reserve liquidity mint
///   2. `[writable]` Deposit reserve account.
///   3. `[writable]` Deposit reserve collateral supply SPL Token account
///   4. `[writable]` Borrow reserve account.
///   5. `[writable]` Borrow reserve liquidity supply SPL Token account
///   6. `[writable]` Obligation
///   7. `[writable]` Obligation token mint
///   8. `[writable]` Obligation token output
///   9. `[]` Obligation token owner
///   10 `[]` Lending market account.
///   11 `[]` Derived lending market authority.
///   12 `[]` User transfer authority ($authority).
///   13 `[]` Dex market
///   14 `[]` Dex market order book side
///   15 `[]` Temporary memory
///   16 `[]` Clock sysvar
///   17 `[]` Rent sysvar
///   18 '[]` Token program id
export const borrowInstruction = (
  amount: number | BN,
  amountType: BorrowAmountType,
  from: PublicKey, // Collateral input SPL Token account. $authority can transfer $collateralAmount
  to: PublicKey, // Liquidity output SPL Token account,
  depositReserve: PublicKey,
  depositReserveCollateralSupply: PublicKey,
  borrowReserve: PublicKey,
  borrowReserveLiquiditySupply: PublicKey,

  obligation: PublicKey,
  obligationMint: PublicKey,
  obligationTokenOutput: PublicKey,
  obligationTokenOwner: PublicKey,

  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  transferAuthority: PublicKey,

  dexMarket: PublicKey,
  dexOrderBookSide: PublicKey,

  memory: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('amount'),
    BufferLayout.u8('amountType'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.BorrowLiquidity,
      amount: new BN(amount),
      amountType,
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: depositReserve, isSigner: false, isWritable: true },
    {
      pubkey: depositReserveCollateralSupply,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: borrowReserve, isSigner: false, isWritable: true },
    {
      pubkey: borrowReserveLiquiditySupply,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: obligationMint, isSigner: false, isWritable: true },
    { pubkey: obligationTokenOutput, isSigner: false, isWritable: true },
    { pubkey: obligationTokenOwner, isSigner: false, isWritable: false },

    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: false, isWritable: false },

    { pubkey: dexMarket, isSigner: false, isWritable: false },
    { pubkey: dexOrderBookSide, isSigner: false, isWritable: false },
    { pubkey: memory, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};

// deposit APY utilization currentUtilizationRate * borrowAPY

export const calculateBorrowAPY = (reserve: LendingReserve) => {
  const totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
  const currentUtilization = totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);
  const optimalUtilization = reserve.config.optimalUtilizationRate / 100;

  let borrowAPY;
  if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
    const normalizedFactor = currentUtilization / optimalUtilization;
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const minBorrowRate = reserve.config.minBorrowRate / 100;
    borrowAPY = normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
  } else {
    const normalizedFactor = (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
    const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
    const maxBorrowRate = reserve.config.maxBorrowRate / 100;
    borrowAPY = normalizedFactor * (maxBorrowRate - optimalBorrowRate) + optimalBorrowRate;
  }

  return borrowAPY;
};
