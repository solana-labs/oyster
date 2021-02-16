import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockConfig, TimelockInstruction } from './timelock';
import BN from 'bn.js';

/// Initializes a new empty Timelocked set of Instructions that will be executed at various slots in the future in draft mode.
/// Grants Admin token to caller.
///
///   1. `[writable]` Uninitialized Timelock set account
///   2. `[writable]` Uninitialized Admin Mint account
///   3. `[writable]` Uninitialized Admin Validation account
///   4. `[writable]` Uninitialized Destination account for first admin token
///   5. `[]` Wallet pubkey - owner of destination account for first admin token
///   6. `[]` Timelock Program
///   7. '[]` Token program id
///   8. `[]` Rent sysvar
export const initTimelockSetInstruction = (
  timelockSetAccount: PublicKey,
  adminMintAccount: PublicKey,
  adminValidationAccount: PublicKey,
  destinationAdminAccount: PublicKey,
  wallet: PublicKey,
  timelockConfig: TimelockConfig,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.u8('consensusAlgorithm'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('timelockType'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: TimelockInstruction.InitTimelockSet,
      consensusAlgorithm: new BN(timelockConfig.consensusAlgorithm),
      executionType: new BN(timelockConfig.executionType),
      timelockType: new BN(timelockConfig.timelockType),
    },
    data,
  );

  const keys = [
    { pubkey: timelockSetAccount, isSigner: true, isWritable: true },
    { pubkey: adminMintAccount, isSigner: true, isWritable: true },
    { pubkey: adminValidationAccount, isSigner: true, isWritable: true },
    { pubkey: destinationAdminAccount, isSigner: true, isWritable: true },
    { pubkey: wallet, isSigner: true, isWritable: false },
    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
