import {
  contexts,
  LENDING_PROGRAM_ID,
  models,
  notify,
  TokenAccount,
} from '@oyster/common';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  depositObligationCollateralInstruction,
  refreshReserveInstruction,
  Reserve,
} from '../models';

const { approve } = models;
const { sendTransaction } = contexts.Connection;

// @FIXME
export const depositObligationCollateral = async (
  connection: Connection,
  wallet: any,
  collateralAmount: number,
  source: TokenAccount,
  reserve: Reserve,
  reserveAddress: PublicKey,
  obligationAddress: PublicKey
) => {
  notify({
    message: 'Depositing collateral...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

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

  instructions.push(
    refreshReserveInstruction(
      reserveAddress,
      reserve.liquidity.oracleOption
        ? reserve.liquidity.oraclePubkey
        : undefined,
    ),
    depositObligationCollateralInstruction(
      collateralAmount,
      sourceCollateral,
      reserve.collateral.mintPubkey,
      reserveAddress,
      obligationAddress,
      reserve.lendingMarket,
      lendingMarketAuthority,
      // @FIXME: wallet must sign
      wallet.publicKey,
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
      message: 'Collateral deposited.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch {
    // TODO:
  }
};
