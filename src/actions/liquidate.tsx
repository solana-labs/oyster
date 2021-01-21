import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendTransaction } from "../contexts/connection";
import { notify } from "../utils/notifications";
import { LendingReserve } from "./../models/lending/reserve";
import { liquidateInstruction } from "./../models/lending/liquidate";
import { AccountLayout } from "@solana/spl-token";
import { LENDING_PROGRAM_ID } from "../utils/ids";
import { createTempMemoryAccount, ensureSplAccount, findOrCreateAccountByMint } from "./account";
import { approve, LendingMarket, LendingObligation, TokenAccount } from "../models";
import { cache, ParsedAccount } from "../contexts/accounts";

export const liquidate = async (
  connection: Connection,
  wallet: any,
  from: TokenAccount, // liquidity account
  amountLamports: number, // in liquidty token (lamports)

  // which loan to repay
  obligation: ParsedAccount<LendingObligation>,

  repayReserve: ParsedAccount<LendingReserve>,

  withdrawReserve: ParsedAccount<LendingReserve>
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

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

  const [authority] = await PublicKey.findProgramAddress(
    [repayReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID
  );

  const fromAccount = ensureSplAccount(
    instructions,
    cleanupInstructions,
    from,
    wallet.publicKey,
    amountLamports + accountRentExempt,
    signers
  );

  // create approval for transfer transactions
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    fromAccount,
    wallet.publicKey,
    amountLamports
  );
  signers.push(transferAuthority);

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    withdrawReserve.info.collateralMint,
    signers
  );

  const dexMarketAddress = repayReserve.info.dexMarketOption
    ? repayReserve.info.dexMarket
    : withdrawReserve.info.dexMarket;
  const dexMarket = cache.get(dexMarketAddress);

  if (!dexMarket) {
    throw new Error(`Dex market doesn't exist.`);
  }

  const market = cache.get(withdrawReserve.info.lendingMarket) as ParsedAccount<LendingMarket>;

  const dexOrderBookSide = market.info.quoteMint.equals(repayReserve.info.liquidityMint)
    ? dexMarket?.info.asks
    : dexMarket?.info.bids;

  const memory = createTempMemoryAccount(instructions, wallet.publicKey, signers, LENDING_PROGRAM_ID);

  instructions.push(
    liquidateInstruction(
      amountLamports,
      fromAccount,
      toAccount,
      repayReserve.pubkey,
      repayReserve.info.liquiditySupply,
      withdrawReserve.pubkey,
      withdrawReserve.info.collateralSupply,
      obligation.pubkey,
      repayReserve.info.lendingMarket,
      authority,
      transferAuthority.publicKey,
      dexMarketAddress,
      dexOrderBookSide,
      memory
    )
  );

  let tx = await sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true);

  notify({
    message: 'Funds liquidated.',
    type: 'success',
    description: `Transaction - ${tx}`,
  });
};
