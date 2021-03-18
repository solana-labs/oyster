import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { DESC_SIZE, NAME_SIZE, TimelockInstruction } from './timelock';

/// Initializes a new empty Timelocked set of Instructions that will be executed at various slots in the future in draft mode.
/// Grants Admin token to caller.
///
///   0. `[writable]` Uninitialized Timelock set account .
///   1. `[writable]` Initialized Signatory Mint account
///   2. `[writable]` Initialized Admin Mint account
///   3. `[writable]` Initialized Voting Mint account
///   4. `[writable]` Initialized Yes Voting Mint account
///   5. `[writable]` Initialized No Voting Mint account
///   6. `[writable]` Initialized Signatory Validation account
///   7. `[writable]` Initialized Admin Validation account
///   8. `[writable]` Initialized Voting Validation account
///   9. `[writable]` Initialized Destination account for first admin token
///   10. `[writable]` Initialized Destination account for first signatory token
///   11. `[writable]` Initialized Yes voting dump account
///   12. `[writable]` Initialized No voting dump account
///   13. `[writable]` Initialized Governance holding account
///   14. `[]` Governance mint
///   15. `[]` Timelock config account.
///   16. `[]` Timelock minting authority
///   17. `[]` Timelock Program
///   18. '[]` Token program id
///   19. `[]` Rent sysvar
export const initTimelockSetInstruction = (
  timelockSetAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  adminMintAccount: PublicKey,
  votingMintAccount: PublicKey,
  yesVotingMintAccount: PublicKey,
  noVotingMintAccount: PublicKey,
  signatoryValidationAccount: PublicKey,
  adminValidationAccount: PublicKey,
  votingValidationAccount: PublicKey,
  destinationAdminAccount: PublicKey,
  destinationSignatoryAccount: PublicKey,
  yesVotingDumpAccount: PublicKey,
  noVotingDumpAccount: PublicKey,
  governanceHoldingAccount: PublicKey,
  governanceMintAccount: PublicKey,
  timelockConfigAccount: PublicKey,
  authority: PublicKey,
  descLink: string,
  name: string,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  if (descLink.length > DESC_SIZE) {
    throw new Error('Desc link is more than ' + DESC_SIZE);
  }

  if (name.length > NAME_SIZE) {
    throw new Error('Name is more than ' + NAME_SIZE);
  }

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
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
    { pubkey: yesVotingMintAccount, isSigner: false, isWritable: true },
    { pubkey: noVotingMintAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryValidationAccount, isSigner: false, isWritable: true },
    { pubkey: adminValidationAccount, isSigner: false, isWritable: true },
    { pubkey: votingValidationAccount, isSigner: false, isWritable: true },
    { pubkey: destinationAdminAccount, isSigner: false, isWritable: true },
    { pubkey: destinationSignatoryAccount, isSigner: false, isWritable: true },
    { pubkey: yesVotingDumpAccount, isSigner: false, isWritable: true },
    { pubkey: noVotingDumpAccount, isSigner: false, isWritable: true },
    { pubkey: governanceHoldingAccount, isSigner: false, isWritable: true },
    {
      pubkey: governanceMintAccount,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: timelockConfigAccount, isSigner: false, isWritable: false },
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
