import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';
import { LendingInstruction } from './instruction';

/// Initializes a new lending market reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source liquidity token account.
///                     $authority can transfer $liquidity_amount.
///   1. `[writable]` Destination collateral token account - uninitialized.
///   2. `[writable]` Reserve account - uninitialized.
///   3. `[]` Reserve liquidity SPL Token mint.
///   4. `[writable]` Reserve liquidity supply SPL Token account - uninitialized.
///   5. `[writable]` Reserve liquidity fee receiver - uninitialized.
///   6. `[writable]` Reserve collateral SPL Token mint - uninitialized.
///   7. `[writable]` Reserve collateral token supply - uninitialized.
///   8. `[]` Quote currency SPL Token mint.
///   9. `[]` Lending market account.
///   10 `[]` Derived lending market authority.
///   11 `[signer]` Lending market owner.
///   12 `[signer]` User transfer authority ($authority).
///   13 `[]` Clock sysvar.
///   13 `[]` Rent sysvar.
///   14 `[]` Token program id.
///   15 `[optional]` Reserve liquidity aggregator account.
///                     Not required for quote currency reserves.
///                     Must match base and quote currency mint, and quote currency decimals.
// InitReserve {
//     /// Initial amount of liquidity to deposit into the new reserve
//     liquidity_amount: u64,
//     /// Reserve configuration values
//     config: ReserveConfig,
// },
export const initReserveInstruction = (
  liquidityAmount: number | BN,
  // @FIXME: reserve config
  maxUtilizationRate: number,
  sourceLiquidity: PublicKey,
  destinationCollateral: PublicKey,
  reserve: PublicKey,
  liquidityMint: PublicKey,
  liquiditySupply: PublicKey,
  liquidityFeeReceiver: PublicKey,
  collateralMint: PublicKey,
  collateralSupply: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey,
  lendingMarketOwner: PublicKey,
  transferAuthority: PublicKey,
  aggregator?: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('liquidityAmount'),
    // @FIXME: reserve config
    BufferLayout.u8('maxUtilizationRate'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.InitReserve,
      liquidityAmount: new BN(liquidityAmount),
      maxUtilizationRate,
    },
    data,
  );

  const keys = [
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: destinationCollateral, isSigner: false, isWritable: true },
    { pubkey: reserve, isSigner: false, isWritable: true },
    { pubkey: liquidityMint, isSigner: false, isWritable: false },
    { pubkey: liquiditySupply, isSigner: false, isWritable: true },
    { pubkey: liquidityFeeReceiver, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: collateralSupply, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: true },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  if (aggregator) {
    keys.push({ pubkey: aggregator, isSigner: false, isWritable: false });
  }

  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
