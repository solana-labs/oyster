import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from '@solana/web3.js';
import { ExplorerLink, isSendTransactionError, isTransactionTimeoutError, utils, WalletSigner } from '@oyster/common';
import React from 'react';
import { DEFAULT_TX_TIMEOUT, sendTransaction2 } from './sdk/core/connection';

const { notify } = utils;

export async function checkMinimumBalanceForRentExpression(connection: Connection, wallet: WalletSigner, instructions: TransactionInstruction[], currentRent = 0): Promise<number> {
  const dataLength = instructions.reduce((p, c) => p + c.data.length, 0);
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(dataLength);
  const rent = accountRentExempt + currentRent;
  if (wallet.publicKey) {
    const balance = await connection.getBalance(wallet.publicKey, connection.commitment);
    if (rent > balance) {
      throw new Error(`You don't have enough SOL for this transaction. Needs minimum balance ${rent / LAMPORTS_PER_SOL} SOL`);
    }
  }
  return rent;
}

export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  pendingMessage: string,
  successMessage: string,
  currentRent = 0
) {
  try {
    const transaction = new Transaction();
    transaction.add(...instructions);
    await checkMinimumBalanceForRentExpression(connection, wallet, instructions, currentRent);

    try {
      notify({
        message: `${pendingMessage}...`,
        description: 'Please wait...',
        type: 'warn'
      });
      const txid = await sendTransaction2({
        transaction,
        wallet,
        signers,
        connection
      });

      notify({
        message: successMessage,
        type: 'success',
        description: <>
          <span>Transaction:</span>
          <ExplorerLink address={txid} type='transaction' short connection={connection} />
        </>
      });
    } catch (txError) {
      if (isTransactionTimeoutError(txError)) {
        notify({
          message: `Transaction hasn't been confirmed within ${DEFAULT_TX_TIMEOUT / 1000}s. Please check on Solana Explorer`,
          description: <ExplorerLink address={txError.txId} type='transaction' short connection={connection} />,
          type: 'warn'
        });
      } else if (isSendTransactionError(txError)) {
        notify({
          message: 'Transaction error',
          description: <ExplorerLink address={txError.txId} type='transaction' short connection={connection} />,
          type: 'error'
        });
      }
      throw txError;
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      notify({
        message: `Transaction error`,
        description: e.message ?? ``,
        type: 'error'
      });
    } else {
      console.error(e);
    }
    throw e;
  }
}
