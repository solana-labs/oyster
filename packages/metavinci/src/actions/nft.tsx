import {
  createAssociatedTokenAccountInstruction,
  createMint,
  createMetadata,
  transferUpdateAuthority,
  programIds,
  sendTransaction,
  sendTransactions,
  notify,
  ENV,
  updateMetadata,
  createMasterEdition,
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
  env: ENV,
  files: File[],
  metadata: { name: string; symbol: string },
): Promise<void> => {
  if (!wallet?.publicKey) {
    return;
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

  // This owner is a temporary signer and owner of metadata we use to circumvent requesting signing
  // twice post Arweave. We store in an account (payer) and use it post-Arweave to update MD with new link
  // then give control back to the user.
  const owner = new Account();
  const payer = new Account();
  const instructions: TransactionInstruction[] = [...pushInstructions];
  const signers: Account[] = [...pushSigners, owner];

  // This is only temporarily owned by wallet...transferred to program by createMasterEdition below
  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode well
    wallet.publicKey,
    wallet.publicKey,
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
      wallet.publicKey,
      [],
      1,
    ),
  );

  const [metadataAccount, nameSymbolAccount] = await createMetadata(
    metadata.symbol,
    metadata.name,
    `https://-------.---/rfX69WKd7Bin_RTbcnH4wM3BuWWsR_ZhWSSqZBLYdMY`,
    true,
    payer.publicKey,
    mintKey,
    owner.publicKey,
    instructions,
    wallet.publicKey,
  );

  const block = await connection.getRecentBlockhash('singleGossip');
  instructions.push(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: payer.publicKey,
      lamports: block.feeCalculator.lamportsPerSignature * 2,
    }),
  );

  let masterEdInstruction: TransactionInstruction[] = [];
  let masterEdSigner: Account[] = [payer];

  // This mint, which allows limited editions to be made, stays with user's wallet.
  const masterMint = createMint(
    masterEdInstruction,
    wallet.publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode well
    wallet.publicKey,
    wallet.publicKey,
    masterEdSigner,
  );

  // In this instruction, mint authority will be removed from the main mint, while
  // minting authority will be maintained for the master mint (which we want.)
  await createMasterEdition(
    metadata.symbol,
    metadata.name,
    undefined,
    mintKey,
    masterMint,
    payer.publicKey,
    wallet.publicKey,
    instructions,
    wallet.publicKey,
  );

  const txIds: string[] = [];
  const response = await sendTransactions(
    connection,
    wallet,
    [instructions, masterEdInstruction],
    [signers, masterEdSigner],
    true,
    true,
    'max',
    txId => {
      txIds.push(txId);
    },
    undefined,
    block,
  );

  // this means we're done getting AR txn setup. Ship it off to ARWeave!
  const data = new FormData();

  const tags = realFiles.reduce(
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [{ name: 'mint', value: mintKey.toBase58() }];
      return acc;
    },
    {},
  );
  data.append('tags', JSON.stringify(tags));
  data.append('transaction', txIds[0]);
  realFiles.map(f => data.append('file[]', f));

  const result: IArweaveResult = await (
    await fetch(
      // TODO: add CNAME
      env === 'mainnet-beta'
        ? 'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFileProd'
        : 'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile',
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
    const updateSigners: Account[] = [payer];

    // TODO: connect to testnet arweave
    const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;
    await updateMetadata(
      metadata.symbol,
      metadata.name,
      arweaveLink,
      undefined,
      mintKey,
      payer.publicKey,
      updateInstructions,
      metadataAccount,
      nameSymbolAccount,
    );

    await transferUpdateAuthority(
      metadataAccount,
      payer.publicKey,
      wallet.publicKey,
      updateInstructions,
    );

    const txid = await sendTransaction(
      connection,
      wallet,
      updateInstructions,
      updateSigners,
      true,
      'singleGossip',
      true,
    );

    notify({
      message: 'Art created on Solana',
      description: (
        <a href={arweaveLink} target="_blank">
          Arweave Link
        </a>
      ),
      type: 'success',
    });

    // TODO: refund funds

    // send transfer back to user
  }
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
