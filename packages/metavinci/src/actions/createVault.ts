import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, createMint } from '@oyster/common';

import { AccountLayout, MintLayout } from '@solana/spl-token';
import BN from 'bn.js';
const {
  createTokenAccount,
  initVault,
  updateExternalPriceAccount,
  ExternalPriceAccount,
  MAX_VAULT_SIZE,
  VAULT_PREFIX,
  MAX_EXTERNAL_ACCOUNT_SIZE,
} = actions;

// This command creates the external pricing oracle a vault
// This gets the vault ready for adding the tokens.
export async function createVault(
  connection: Connection,
  wallet: any,
): Promise<{
  vault: PublicKey;
  externalPriceAccount: PublicKey;
  fractionalMint: PublicKey;
  redeemTreasury: PublicKey;
  fractionTreasury: PublicKey;
  priceMint: PublicKey;
  instructions: TransactionInstruction[];
  signers: Account[];
}> {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  const vaultRentExempt = await connection.getMinimumBalanceForRentExemption(
    MAX_VAULT_SIZE,
  );

  const epaRentExempt = await connection.getMinimumBalanceForRentExemption(
    MAX_EXTERNAL_ACCOUNT_SIZE,
  );

  let vault = new Account();
  let externalPriceAccount = new Account();

  const vaultAuthority = (
    await PublicKey.findProgramAddress(
      [Buffer.from(VAULT_PREFIX), PROGRAM_IDS.vault.toBuffer()],
      PROGRAM_IDS.vault,
    )
  )[0];

  const fractionalMint = createMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    vaultAuthority,
    vaultAuthority,
    signers,
  );
  const priceMint = createMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    vaultAuthority,
    vaultAuthority,
    signers,
  );

  let epaStruct = new ExternalPriceAccount({
    pricePerShare: new BN(0),
    priceMint: priceMint,
    allowedToCombine: true,
  });

  const redeemTreasury = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    priceMint,
    vaultAuthority,
    signers,
  );

  const fractionTreasury = createTokenAccount(
    instructions,
    wallet.publicKey,
    accountRentExempt,
    fractionalMint,
    vaultAuthority,
    signers,
  );

  const uninitializedVault = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: vault.publicKey,
    lamports: vaultRentExempt,
    space: MAX_VAULT_SIZE,
    programId: PROGRAM_IDS.vault,
  });
  const uninitializedEPA = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: vault.publicKey,
    lamports: epaRentExempt,
    space: MAX_EXTERNAL_ACCOUNT_SIZE,
    programId: PROGRAM_IDS.vault,
  });
  instructions.push(uninitializedVault);
  instructions.push(uninitializedEPA);
  signers.push(vault);
  signers.push(externalPriceAccount);

  await updateExternalPriceAccount(
    externalPriceAccount.publicKey,
    epaStruct,
    instructions,
  );

  await initVault(
    true,
    fractionalMint,
    redeemTreasury,
    fractionTreasury,
    vault.publicKey,
    wallet.publicKey,
    externalPriceAccount.publicKey,
    instructions,
  );

  return {
    vault: vault.publicKey,
    externalPriceAccount: externalPriceAccount.publicKey,
    fractionalMint,
    redeemTreasury,
    fractionTreasury,
    priceMint,
    signers,
    instructions,
  };
}
