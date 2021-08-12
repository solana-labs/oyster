import { ExplorerLink, sendTransaction, utils, WalletSigner } from '@oyster/common';
import { Account, TransactionInstruction, Connection } from '@solana/web3.js';
import React from 'react';

const { notify } = utils;

export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Account[],
  pendingMessage: string,
  successMessage: string,
) {
  notify({
    message: `${pendingMessage}...`,
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, signers);

    notify({
      message: successMessage,
      type: 'success',
      description: (
        <>
          {'Transaction: '}
          <ExplorerLink
            address={tx.txid}
            type="transaction"
            short
            connection={connection}
          />
        </>
      ),
    });
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}
