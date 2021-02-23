import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import {
  DESC_SIZE,
  NAME_SIZE,
  TimelockConfig,
  TimelockInstruction,
} from './timelock';
import BN from 'bn.js';

/// Initializes a new empty Timelocked set of Instructions that will be executed at various slots in the future in draft mode.
/// Grants Admin token to caller.
///
///   0. `[writable]` Uninitialized Timelock set account .
///   1. `[writable]` Uninitialized Signatory Mint account
///   2. `[writable]` Uninitialized Admin Mint account
///   3. `[writable]` Uninitialized Voting Mint account
///   4. `[writable]` Uninitialized Signatory Validation account
///   5. `[writable]` Uninitialized Admin Validation account
///   6. `[writable]` Uninitialized Voting Validation account
///   7. `[writable]` Uninitialized Destination account for first admin token
///   8. `[writable]` Uninitialized Destination account for first signatory token
///   9. `[]` Timelock program mint authority
///   10. `[]` Timelock Program
///   11. '[]` Token program id
///   12. `[]` Rent sysvar
export const initTimelockSetInstruction = (
  timelockSetAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  adminMintAccount: PublicKey,
  votingMintAccount: PublicKey,
  signatoryValidationAccount: PublicKey,
  adminValidationAccount: PublicKey,
  votingValidationAccount: PublicKey,
  destinationAdminAccount: PublicKey,
  destinationSignatoryAccount: PublicKey,
  authority: PublicKey,
  timelockConfig: TimelockConfig,
  descLink: string,
  name: string,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  if (descLink.length > DESC_SIZE) {
    throw new Error('Desc link is more than ' + DESC_SIZE);
  }

  if (name.length > NAME_SIZE) {
    throw new Error('Name is more than ' + DESC_SIZE);
  }

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.u8('consensusAlgorithm'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('timelockType'),
    BufferLayout.seq(BufferLayout.u8(), DESC_SIZE, 'descLink'),
    BufferLayout.seq(BufferLayout.u8(), NAME_SIZE, 'name'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  const descAsBytes = utils.toUTF8Array(descLink);
  for (let i = descAsBytes.length; i <= DESC_SIZE - 1; i++) {
    descAsBytes.push(0);
  }
  const nameAsBytes = utils.toUTF8Array(name);
  for (let i = nameAsBytes.length; i <= NAME_SIZE - 1; i++) {
    nameAsBytes.push(0);
  }

  dataLayout.encode(
    {
      instruction: TimelockInstruction.InitTimelockSet,
      consensusAlgorithm: new BN(timelockConfig.consensusAlgorithm),
      executionType: new BN(timelockConfig.executionType),
      timelockType: new BN(timelockConfig.timelockType),
      descLink: descAsBytes,
      name: nameAsBytes,
    },
    data,
  );

  const keys = [
    { pubkey: timelockSetAccount, isSigner: true, isWritable: true },
    { pubkey: signatoryMintAccount, isSigner: false, isWritable: true },
    { pubkey: adminMintAccount, isSigner: false, isWritable: true },
    { pubkey: votingMintAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryValidationAccount, isSigner: false, isWritable: true },
    { pubkey: adminValidationAccount, isSigner: false, isWritable: true },
    { pubkey: votingValidationAccount, isSigner: false, isWritable: true },
    { pubkey: destinationAdminAccount, isSigner: false, isWritable: true },
    { pubkey: destinationSignatoryAccount, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
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
