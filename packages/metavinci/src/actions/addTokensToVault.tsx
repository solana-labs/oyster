import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, actions, models } from '@oyster/common';

import { AccountLayout } from '@solana/spl-token';
import BN from 'bn.js';
const {
  createTokenAccount,
  activateVault,
  addTokenToInactiveVault,
  VAULT_PREFIX,
} = actions;
const { approve } = models;

const BATCH_SIZE = 4;
// This command batches out adding tokens to a vault using a prefilled payer account, and then activates
// the vault for use. It issues a series of transaction instructions and signers for the sendTransactions batch.
export async function addTokensToVault(
  connection: Connection,
  wallet: any,
  vault: PublicKey,
  fractionMint: PublicKey,
  fractionTreasury: PublicKey,
  nfts: { tokenAccount: PublicKey; tokenMint: PublicKey; amount: BN }[],
): Promise<{
  instructions: Array<TransactionInstruction[]>;
  signers: Array<Account[]>;
}> {
  const PROGRAM_IDS = utils.programIds();

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const vaultAuthority = (
    await PublicKey.findProgramAddress(
      [Buffer.from(VAULT_PREFIX), PROGRAM_IDS.vault.toBuffer()],
      PROGRAM_IDS.vault,
    )
  )[0];

  let batchCounter = 0;

  let signers: Array<Account[]> = [];
  let instructions: Array<TransactionInstruction[]> = [];

  let currSigners: Account[] = [];
  let currInstructions: TransactionInstruction[] = [];
  nfts.forEach(nft => {
    const newStoreAccount = createTokenAccount(
      currInstructions,
      wallet.publicKey,
      accountRentExempt,
      nft.tokenMint,
      vaultAuthority,
      currSigners,
    );

    const transferAuthority = approve(
      currInstructions,
      [],
      nft.tokenAccount,
      wallet.publicKey,
      nft.amount.toNumber(),
    );

    currSigners.push(transferAuthority);

    addTokenToInactiveVault(
      nft.amount,
      nft.tokenMint,
      nft.tokenAccount,
      newStoreAccount,
      vault,
      vaultAuthority,
      wallet.publicKey,
      transferAuthority.publicKey,
      currInstructions,
    );

    if (batchCounter == BATCH_SIZE) {
      signers.push(currSigners);
      instructions.push(currInstructions);
      batchCounter = 0;
      currSigners = [];
      currInstructions = [];
    }
  });

  currSigners = [];
  currInstructions = [];

  activateVault(
    new BN(0),
    vault,
    fractionMint,
    fractionTreasury,
    vaultAuthority,
    currInstructions,
  );

  signers.push(currSigners);
  instructions.push(currInstructions);

  return { signers, instructions };
}
