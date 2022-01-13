import {
  TransactionInstruction,
  Connection,
  Transaction,
  Keypair
} from '@solana/web3.js';
import {
  ExplorerLink,
  isSendTransactionError,
  isTransactionTimeoutError,
  utils,
  WalletSigner,
} from '@oyster/common';
import React from 'react';
import { DEFAULT_TX_TIMEOUT, sendTransaction2 } from './sdk/core/connection';

const { notify } = utils;

export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  pendingMessage: string,
  successMessage: string,
) {
  notify({
    message: `${pendingMessage}...`,
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    const transaction = new Transaction();
    transaction.add(...instructions);

    try {
      let txid = await sendTransaction2({
        transaction,
        wallet,
        signers,
        connection,
      });

      notify({
        message: successMessage,
        type: 'success',
        description: (
          <>
            {'Transaction: '}
            <ExplorerLink
              address={txid}
              type="transaction"
              short
              connection={connection}
            />
          </>
        ),
      });
    } catch (txError) {
      if (isTransactionTimeoutError(txError)) {
        notify({
          message: `Transaction hasn't been confirmed within ${DEFAULT_TX_TIMEOUT / 1000
            }s. Please check on Solana Explorer`,
          description: (
            <>
              <ExplorerLink
                address={txError.txId}
                type="transaction"
                short
                connection={connection}
              />
            </>
          ),
          type: 'warn',
        });
      } else if (isSendTransactionError(txError)) {
        notify({
          message: 'Transaction error',
          description: (
            <>
              <ExplorerLink
                address={txError.txId}
                type="transaction"
                short
                connection={connection}
              />
            </>
          ),
          type: 'error',
        });
      }
      throw txError;
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}
