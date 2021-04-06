import {
  createAssociatedTokenAccountInstruction,
  createMint,
  createMetadata,
  updateMetadata,
  programIds,
  sendTransactions,
  sendTransaction,
  notify,
} from '@oyster/common';
import React from 'react';
import { MintLayout, Token } from '@solana/spl-token';
import { WalletAdapter } from '@solana/wallet-base';
import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import crypto from 'crypto';
import { getAssetCostToStore } from '../utils/assets';
import { AR_SOL_HOLDER_ID } from '../utils/ids';
const RESERVED_TXN_MANIFEST = 'manifest.json';

interface IArweaveResult {
  error?: string;
  messages?: Array<{
    filename: string;
    status: 'success' | 'fail';
    transactionId?: string;
    error?: string;
  }>;
}
export const mintNFT = async (
  connection: Connection,
  wallet: WalletAdapter | undefined,
  files: File[],
  metadata: { name: string; symbol: string },
): Promise<IArweaveResult> => {
  if (!wallet?.publicKey) {
    return { error: 'No wallet' };
  }
  const realFiles: File[] = [
    ...files,
    new File([JSON.stringify(metadata)], 'metadata.json'),
  ];

  const {
    instructions: pushInstructions,
    signers: pushSigners,
  } = await prepPayForFilesTxn(wallet, realFiles, metadata);

  const TOKEN_PROGRAM_ID = programIds().token;

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  const owner = new Account();
  const instructions: TransactionInstruction[] = [];
  const signers: Account[] = [owner];

  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    owner.publicKey,
    owner.publicKey,
    signers,
  );

  const recipientKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        programIds().token.toBuffer(),
        mintKey.toBuffer(),
      ],
      programIds().associatedToken,
    )
  )[0];

  createAssociatedTokenAccountInstruction(
    instructions,
    recipientKey,
    wallet.publicKey,
    wallet.publicKey,
    mintKey,
  );

  instructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintKey,
      recipientKey,
      owner.publicKey,
      [],
      1,
    ),
  );

  await createMetadata(
    metadata.symbol,
    metadata.name,
    `https://google.com`,
    mintKey,
    owner.publicKey,
    instructions,
    wallet.publicKey,
    wallet.publicKey,
    signers,
  );
  return new Promise(async res => {
    const txId = await sendTransactions(
      connection,
      wallet,
      [instructions, pushInstructions],
      [signers, pushSigners],
      true,
      'max',
      async (txid: string, ind: number) => {
        if (ind == 1) {
          // this means we're done getting AR txn setup. Ship it off to ARWeave!
          const data = new FormData();

          const tags = realFiles.reduce(
            (
              acc: Record<string, Array<{ name: string; value: string }>>,
              f,
            ) => {
              acc[f.name] = [{ name: 'mint', value: mintKey.toBase58() }];
              return acc;
            },
            {},
          );
          data.append('tags', JSON.stringify(tags));
          data.append('transaction', txid);
          realFiles.map(f => data.append('file[]', f));

          const result: IArweaveResult = await (
            await fetch(
              'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile',
              {
                method: 'POST',
                body: data,
              },
            )
          ).json();

          const metadataFile = result.messages?.find(
            m => m.filename == RESERVED_TXN_MANIFEST,
          );
          if (metadataFile?.transactionId && wallet.publicKey) {
            const updateInstructions: TransactionInstruction[] = [];
            const updateSigners: Account[] = [];

            const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;
            await updateMetadata(
              metadata.symbol,
              metadata.name,
              arweaveLink,
              mintKey,
              wallet.publicKey,
              updateInstructions,
              updateSigners,
            );

            await sendTransaction(
              connection,
              wallet,
              updateInstructions,
              updateSigners,
              true,
              'singleGossip',
            );

            notify({
              message: 'Art created on Solana',
              description: <a href={arweaveLink} target="_blank" >Arweave Link</a>,
              type: 'success',
            });
          }
          console.log('Result', result);
          res(result);
        }
      },
    );
  });
  // TODO:
  // 1. Jordan: --- upload file and metadata to storage API
  // 2. pay for storage by hashing files and attaching memo for each file
};

export const prepPayForFilesTxn = async (
  wallet: WalletAdapter,
  files: File[],
  metadata: any,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Account[];
}> => {
  const memo = programIds().memo;

  const instructions: TransactionInstruction[] = [];
  const signers: Account[] = [];

  if (wallet.publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: await getAssetCostToStore(files),
      }),
    );

  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(await files[i].text());
    const hex = hashSum.digest('hex');
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
        data: Buffer.from(hex),
      }),
    );
  }

  return {
    instructions,
    signers,
  };
};
