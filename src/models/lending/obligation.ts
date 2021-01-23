import {
  AccountInfo,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LendingInstruction } from ".";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../utils/ids";
import * as Layout from "./../../utils/layout";

export const LendingObligationLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("version"),
    /// Amount of collateral tokens deposited for this obligation
    Layout.uint64("depositedCollateral"),
    /// Reserve which collateral tokens were deposited into
    Layout.publicKey("collateralReserve"),
    /// Borrow rate used for calculating interest.
    Layout.uint128("cumulativeBorrowRateWad"),
    /// Amount of tokens borrowed for this obligation plus interest
    Layout.uint128("borrowAmountWad"),
    /// Reserve which tokens were borrowed from
    Layout.publicKey("borrowReserve"),
    /// Mint address of the tokens for this obligation
    Layout.publicKey("tokenMint"),

    // extra space for future contract changes
    BufferLayout.blob(128, "padding"),
  ]
);

export const isLendingObligation = (info: AccountInfo<Buffer>) => {
  return info.data.length === LendingObligationLayout.span;
};

export interface LendingObligation {
  version: number;

  depositedCollateral: BN;
  collateralReserve: PublicKey;
  cumulativeBorrowRateWad: BN; // decimals
  borrowAmountWad: BN; // decimals
  borrowReserve: PublicKey;
  tokenMint: PublicKey;
}

export const LendingObligationParser = (
  pubKey: PublicKey,
  info: AccountInfo<Buffer>
) => {
  const buffer = Buffer.from(info.data);
  const data = LendingObligationLayout.decode(buffer);

  const details = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: data,
  };

  return details;
};

export const healthFactorToRiskColor = (health: number) => {
  return "";
};

export const initObligationInstruction = (
  depositReserve: PublicKey,
  borrowReserve: PublicKey,
  obligation: PublicKey,
  obligationMint: PublicKey,
  obligationTokenOutput: PublicKey,
  obligationTokenOwner: PublicKey,
  lendingMarket: PublicKey,
  lendingMarketAuthority: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8("instruction")]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.InitObligation,
    },
    data
  );

  const keys = [
    { pubkey: depositReserve, isSigner: false, isWritable: false },
    { pubkey: borrowReserve, isSigner: false, isWritable: false },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: obligationMint, isSigner: false, isWritable: true },
    { pubkey: obligationTokenOutput, isSigner: false, isWritable: true },
    { pubkey: obligationTokenOwner, isSigner: false, isWritable: false },

    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },

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
