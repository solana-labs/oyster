import { notify, sendTransaction } from '@oyster/common';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  initObligationInstruction,
  OBLIGATION_SIZE,
} from '@solana/spl-token-lending';
import { createObligation } from './createObligation';

export const initObligation = async (
  connection: Connection,
  wallet: any,
  lendingMarket: PublicKey,
) => {
  notify({
    message: 'Initializing obligation...',
    description: 'Please review transactions to approve.',
    type: 'warn',
  });

  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const obligationRentExempt = await connection.getMinimumBalanceForRentExemption(
    OBLIGATION_SIZE,
  );

  const obligationAddress = createObligation(
    instructions,
    wallet.publicKey,
    obligationRentExempt,
    signers,
  );

  instructions.push(
    initObligationInstruction(
      obligationAddress,
      lendingMarket,
      wallet.publicKey,
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
      message: 'Obligation initialized.',
      type: 'success',
      description: `Transaction - ${txid}`,
    });
  } catch {
    // TODO:
    throw new Error();
  }
};
