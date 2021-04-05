import {
  createAssociatedTokenAccountInstruction,
  createMint,
  programIds,
  sendTransaction,
} from '@oyster/common';
import { MintLayout, Token } from '@solana/spl-token';
import { WalletAdapter } from '@solana/wallet-base';
import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';

export const mintNFT = async (
  connection: Connection,
  wallet: WalletAdapter | undefined,
  files: Buffer[],
) => {
  if (!wallet?.publicKey) {
    return;
  }

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
    `🥭🧢#`,
    `name: 🥭🧢#`,
    `https://google.com`,
    mintKey,
    owner.publicKey,
    instructions,
    wallet.publicKey,
    wallet.publicKey,
    signers,
  );

  // For Jordan -> Transfer SOL
  console.log(files.length);
  // TODO:
  // instructions.push(
  //   Token.createSetAuthorityInstruction(
  //     TOKEN_PROGRAM_ID,
  //     mintKey,
  //     owner.publicKey,
  //     owner.publicKey,
  //     []));

  const txId = await sendTransaction(
    connection,
    wallet,
    instructions,
    signers,
    true,
  );

  // TODO:
  // 1. Jordan: --- upload file and metadata to storage API
  // 2. pay for storage by hashing files and attaching memo for each file
};
