import {
  AUCTION_PREFIX,
  programIds,
  VAULT_PREFIX,
  VAULT_SCHEMA,
} from '@oyster/common';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { serialize } from 'borsh';

import {
  AuctionManagerSettings,
  InitAuctionManagerArgs,
  METAPLEX_PREFIX,
} from '.';

export async function initAuctionManager(
  vault: PublicKey,
  openEditionMetadata: PublicKey,
  openEditionNameSymbol: PublicKey,
  openEditionAuthority: PublicKey,
  openEditionMasterAccount: PublicKey,
  openEditionMint: PublicKey,
  openEditionMasterMint: PublicKey,
  openEditionMasterMintAuthority: PublicKey,
  auctionManagerAuthority: PublicKey,
  payer: PublicKey,
  acceptPaymentAccount: PublicKey,
  settings: AuctionManagerSettings,
  instructions: TransactionInstruction[],
) {
  const PROGRAM_IDS = programIds();

  const auctionKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from(AUCTION_PREFIX),
        PROGRAM_IDS.auction.toBuffer(),
        vault.toBuffer(),
      ],
      PROGRAM_IDS.auction,
    )
  )[0];

  const auctionManagerKey: PublicKey = (
    await PublicKey.findProgramAddress(
      [Buffer.from(METAPLEX_PREFIX), auctionKey.toBuffer()],
      PROGRAM_IDS.metaplex,
    )
  )[0];

  const value = new InitAuctionManagerArgs({
    settings,
  });

  /// Initializes an Auction Manager
  ///   0. `[writable]` Uninitialized, unallocated auction manager account with pda of ['metaplex', auction_key from auction referenced below]
  ///   1. `[]` Activated vault account with authority set to auction manager account (this will be checked)
  ///           Note in addition that this vault account should have authority set to this program's pda of ['metaplex', auction_key]
  ///   2. `[]` Auction with auctioned item being set to the vault given and authority set to this program's pda of ['metaplex', auction_key]
  ///   3. `[writable]` Open edition metadata
  ///   4. `[writable]` Open edition name symbol
  ///           (This account is optional, and will only be used if metadata is unique, otherwise this account key will be ignored no matter it's value)
  ///   5. `[signer]` Open edition authority
  ///   6. `[]` Open edition MasterEdition account (optional - only if using this feature)
  ///   7. `[writable]` Open edition Mint account (optional - only if using this feature)
  ///   8. `[]` Open edition Master Mint account (optional - only if using this feature)
  ///   9. `[signer]` Open edition Master Mint Authority account, this will PERMANENTLY TRANSFER MINTING
  ///        AUTHORITY TO AUCTION MANAGER. You can still mint your own editions via your own personal authority however. (optional - only if using this feature)
  ///   10. `[]` Authority for the Auction Manager
  ///   11. `[signer]` Payer
  ///   12. `[]` Accept payment account of same token mint as the auction for taking payment for open editions, owner should be auction manager key
  ///   13. `[]` Token program
  ///   14. `[]` Token vault program
  ///   15. `[]` Token metadata program
  ///   16. `[]` Auction program
  ///   17. `[]` System sysvar
  ///   18. `[]` Rent sysvar

  const data = Buffer.from(serialize(VAULT_SCHEMA, value));
  const keys = [
    {
      pubkey: safetyDepositBox,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: tokenAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: tokenStoreAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vault,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: vaultAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: transferAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: programIds().token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: vaultProgramId,
      data,
    }),
  );
}
