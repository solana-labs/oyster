import {
  contexts,
  findOrCreateAccountByMint,
  LEND_HOST_FEE_ADDRESS,
  LENDING_PROGRAM_ID,
  notify,
  ParsedAccount,
  toLamports,
} from '@oyster/common';
import { AccountLayout, MintInfo } from '@solana/spl-token';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  borrowObligationLiquidityInstruction,
  Obligation,
  refreshObligationInstruction,
  refreshReserveInstruction,
  Reserve,
} from '../models';

const { cache, MintParser } = contexts.Accounts;
const { sendTransaction } = contexts.Connection;

// @FIXME
export const borrowObligationLiquidity = async (
  connection: Connection,
  wallet: any,
  liquidityAmount: number,
  borrowReserve: ParsedAccount<Reserve>,
  obligation: ParsedAccount<Obligation>,
) => {
  notify({
    message: 'Borrowing funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];
  let cleanupInstructions: TransactionInstruction[] = [];
  let finalCleanupInstructions: TransactionInstruction[] = [];

  const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
    [borrowReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  // Creates host fee account if it doesn't exist
  let hostFeeReceiver = LEND_HOST_FEE_ADDRESS
    ? findOrCreateAccountByMint(
        wallet.publicKey,
        LEND_HOST_FEE_ADDRESS,
        instructions,
        [],
        accountRentExempt,
        borrowReserve.info.liquidity.mint,
        signers,
      )
    : undefined;

  const mint = (await cache.query(
    connection,
    borrowReserve.info.liquidity.mint,
    MintParser,
  )) as ParsedAccount<MintInfo>;

  // @TODO: handle 100% -> u64::MAX
  const amountLamports = toLamports(liquidityAmount, mint?.info);

  let destinationLiquidity = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    finalCleanupInstructions,
    accountRentExempt,
    borrowReserve.info.liquidity.mint,
    signers,
  );

  if (instructions.length > 0) {
    // create all accounts in one transaction
    let { txid } = await sendTransaction(connection, wallet, instructions, [
      ...signers,
    ]);

    notify({
      // @TODO: change message
      message: 'Obligation accounts created',
      description: `Transaction ${txid}`,
      type: 'success',
    });
  }

  notify({
    message: 'Borrowing funds...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  // @FIXME: signers
  signers = [];
  instructions = [];
  cleanupInstructions = [...finalCleanupInstructions];

  instructions.push(
    refreshReserveInstruction(
      borrowReserve.pubkey,
      borrowReserve.info.liquidity.aggregatorOption
        ? borrowReserve.info.liquidity.aggregator
        : undefined,
    ),
    refreshObligationInstruction(
      obligation.pubkey,
      obligation.info.deposits.map((collateral) => collateral.depositReserve),
      obligation.info.borrows.map((liquidity) => liquidity.borrowReserve),
    ),
    borrowObligationLiquidityInstruction(
      amountLamports,
      borrowReserve.info.liquidity.supply,
      destinationLiquidity,
      borrowReserve.pubkey,
      borrowReserve.info.liquidity.feeReceiver,
      obligation.pubkey,
      borrowReserve.info.lendingMarket,
      lendingMarketAuthority,
      obligation.info.owner,
      hostFeeReceiver,
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
      message: 'Funds borrowed.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
