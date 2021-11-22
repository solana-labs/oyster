import { notify, sendTransaction, WalletSigner } from '@oyster/common';
import { u64 } from '@solana/spl-token';

import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';

import { withMint } from './generateGovernanceArtifacts';

export const generateMint = async (
  connection: Connection,
  wallet: WalletSigner,
  decimals: number,
  amount: u64,
  supply: u64,
  otherOwnerWallet: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const { mintAddress } = await withMint(
    instructions,
    signers,
    connection,
    wallet,
    decimals,
    amount,
    supply,
    otherOwnerWallet,
  );

  notify({
    message: 'Creating mint...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, signers);

    notify({
      message: 'Mint created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return {
      mintAddress,
    };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};
