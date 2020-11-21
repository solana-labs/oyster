import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import { LendingReserve } from "./../models/lending/reserve";
import { AccountLayout, MintInfo, MintLayout, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants/ids";
import {
  createTempMemoryAccount,
  createUninitializedAccount,
  createUninitializedMint,
  createUninitializedObligation,
  ensureSplAccount,
  findOrCreateAccountByMint,
} from "./account";
import { cache, MintParser, ParsedAccount } from "../contexts/accounts";
import {
  TokenAccount,
  LendingObligationLayout,
  borrowInstruction,
  LendingMarket,
} from "../models";
import { toLamports } from "../utils/utils";

export const borrow = async (
  from: TokenAccount,
  amount: number,

  borrowReserve: LendingReserve,
  borrowReserveAddress: PublicKey,

  depositReserve: LendingReserve,
  depositReserveAddress: PublicKey,

  connection: Connection,
  wallet: any
) => {
  notify({
    message: "Borrowing funds...",
    description: "Please review transactions to approve.",
    type: "warn",
  });

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
  let cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const obligation = createUninitializedObligation(
    instructions,
    wallet.publicKey,
    await connection.getMinimumBalanceForRentExemption(
      LendingObligationLayout.span
    ),
    signers
  );

  const obligationMint = createUninitializedMint(
    instructions,
    wallet.publicKey,
    await connection.getMinimumBalanceForRentExemption(MintLayout.span),
    signers
  );

  const obligationTokenOutput = createUninitializedAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    signers
  );

  let toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    borrowReserve.liquidityMint,
    signers
  );

  // create all accounts in one transaction
  let tx = await sendTransaction(connection, wallet, instructions, [
    ...signers,
  ]);

  notify({
    message: "Obligation accounts created",
    description: `Transaction ${tx}`,
    type: "success",
  });

  notify({
    message: "Adding Liquidity...",
    description: "Please review transactions to approve.",
    type: "warn",
  });

  signers = [];
  instructions = [];
  cleanupInstructions = [];

  const [authority] = await PublicKey.findProgramAddress(
    [depositReserve.lendingMarket.toBuffer()], // which account should be authority
    LENDING_PROGRAM_ID
  );

  const mint = (await cache.query(
    connection,
    depositReserve.collateralMint,
    MintParser
  )) as ParsedAccount<MintInfo>;
  const amountLamports = toLamports(amount, mint?.info);

  const fromAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    from,
    wallet.publicKey,
    amountLamports + accountRentExempt,
    signers
  );

  // create approval for transfer transactions
  instructions.push(
    Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      fromAccount,
      authority,
      wallet.publicKey,
      [],
      amountLamports
    )
  );

  const market = cache.get(depositReserve.lendingMarket) as ParsedAccount<
    LendingMarket
  >;

  const dexMarketAddress = borrowReserve.dexMarketOption
    ? borrowReserve.dexMarket
    : depositReserve.dexMarket;
  const dexMarket = cache.get(dexMarketAddress);

  if (!dexMarket) {
    throw new Error(`Dex market doesn't exsists.`);
  }

  const dexOrderBookSide = market.info.quoteMint.equals(
    depositReserve.liquidityMint
  )
    ? dexMarket?.info.bids
    : dexMarket?.info.asks;

  const memory = createTempMemoryAccount(
    instructions,
    wallet.publicKey,
    signers
  );

  // deposit
  instructions.push(
    borrowInstruction(
      amountLamports,
      fromAccount,
      toAccount,
      depositReserveAddress,
      depositReserve.collateralSupply,
      borrowReserveAddress,
      borrowReserve.liquiditySupply,

      obligation,
      obligationMint,
      obligationTokenOutput,
      wallet.publicKey,

      authority,

      dexMarketAddress,
      dexOrderBookSide,

      memory
    )
  );
  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true
    );

    notify({
      message: "Funds borrowed.",
      type: "success",
      description: `Transaction - ${tx}`,
    });
  } catch {
    // TODO:
  }
};
