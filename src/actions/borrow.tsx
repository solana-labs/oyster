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
  BorrowAmountType,
  LendingObligation,
} from "../models";
import { toLamports } from "../utils/utils";

export const borrow = async (
  from: TokenAccount,
  amount: number,
  amountType: BorrowAmountType,

  borrowReserve: ParsedAccount<LendingReserve>,

  depositReserve: ParsedAccount<LendingReserve>,

  exsistingObligation: ParsedAccount<LendingObligation> | undefined,

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
    borrowReserve.info.liquidityMint,
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
    [depositReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID
  );

  

  let amountLamports: number = 0;
  let fromLamports: number = 0;
  if(amountType === BorrowAmountType.LiquidityBorrowAmount) {
    // approve max transfer 
    // TODO: improve contrain by using dex market data
    const approvedAmount = from.info.amount.toNumber();

    fromLamports = approvedAmount - accountRentExempt;

    const mint = (await cache.query(
      connection,
      borrowReserve.info.liquidityMint,
      MintParser
    )) as ParsedAccount<MintInfo>;

    amountLamports = toLamports(amount, mint?.info);
  } else if(amountType === BorrowAmountType.CollateralDepositAmount) {
    const mint = (await cache.query(
      connection,
      depositReserve.info.collateralMint,
      MintParser
    )) as ParsedAccount<MintInfo>;
    amountLamports = toLamports(amount, mint?.info);
    fromLamports = amountLamports;
  }

  const fromAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    from,
    wallet.publicKey,
    fromLamports + accountRentExempt,
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
      fromLamports
    )
  );

  const market = cache.get(depositReserve.info.lendingMarket) as ParsedAccount<
    LendingMarket
  >;

  const dexMarketAddress = borrowReserve.info.dexMarketOption
    ? borrowReserve.info.dexMarket
    : depositReserve.info.dexMarket;
  const dexMarket = cache.get(dexMarketAddress);

  if (!dexMarket) {
    throw new Error(`Dex market doesn't exsists.`);
  }

  const dexOrderBookSide = market.info.quoteMint.equals(
    depositReserve.info.liquidityMint
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
      amountType,
      fromAccount,
      toAccount,
      depositReserve.pubkey,
      depositReserve.info.collateralSupply,
      borrowReserve.pubkey,
      borrowReserve.info.liquiditySupply,

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
