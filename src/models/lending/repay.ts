import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants/ids";
import { LendingInstruction } from "./lending";
import * as BufferLayout from "buffer-layout";
import * as Layout from "./../../utils/layout";

/// Repay loaned tokens to a reserve and receive collateral tokens. The obligation balance
/// will be recalculated for interest.
///
///   0. `[writable]` Liquidity input SPL Token account, $authority can transfer $liquidity_amount
///   1. `[writable]` Collateral output SPL Token account
///   2. `[writable]` Repay reserve account.
///   3. `[writable]` Repay reserve liquidity supply SPL Token account
///   4. `[]` Withdraw reserve account.
///   5. `[writable]` Withdraw reserve collateral supply SPL Token account
///   6. `[writable]` Obligation - initialized
///   7. `[writable]` Obligation token mint, $authority can transfer calculated amount
///   8. `[writable]` Obligation token input
///   9. `[]` Derived lending market authority ($authority).
///   10 `[]` Clock sysvar
///   11 `[]` Token program id
export const repayInstruction = (
  liquidityAmount: number | BN,
  from: PublicKey, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Collateral output SPL Token account,
  repayReserveAccount: PublicKey,
  repayReserveLiquiditySupply: PublicKey,
  withdrawReserve: PublicKey,
  withdrawReserveCollateralSupply: PublicKey,
  obligation: PublicKey,
  obligationMint: PublicKey,
  obligationInput: PublicKey,
  authority: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.RepayOblogationLiquidity,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },

    { pubkey: repayReserveAccount, isSigner: false, isWritable: true },
    { pubkey: repayReserveLiquiditySupply, isSigner: false, isWritable: true },

    { pubkey: withdrawReserve, isSigner: false, isWritable: false },
    {
      pubkey: withdrawReserveCollateralSupply,
      isSigner: false,
      isWritable: true,
    },

    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: obligationMint, isSigner: false, isWritable: true },
    { pubkey: obligationInput, isSigner: false, isWritable: true },

    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
