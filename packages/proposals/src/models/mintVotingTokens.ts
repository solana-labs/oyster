import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as Layout from '../utils/layout';

import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';
import BN from 'bn.js';

/// [Requires Signatory token]
/// Mints voting tokens for a destination account to be used during the voting process.
///
///   0. `[writable]` Timelock set account.
///   1. `[writable]` Initialized Voting account.
///   2. `[writable]` Voting mint account.
///   3. `[writable]` Signatory account
///   4. `[writable]` Signatory validation account.
///   5. `[]` Transfer authority
///   6. `[]` Timelock program mint authority
///   7. `[]` Timelock program account pub key.
///   8. `[]` Token program account.
export const mintVotingTokensInstruction = (
  timelockSetAccount: PublicKey,
  votingAccount: PublicKey,
  votingMint: PublicKey,
  signatoryAccount: PublicKey,
  signatoryValidationAccount: PublicKey,
  transferAuthority: PublicKey,
  mintAuthority: PublicKey,
  votingTokenAmount: number,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('votingTokenAmount'),
  ]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.MintVotingTokens,
      votingTokenAmount: new BN(votingTokenAmount),
    },
    data,
  );

  const keys = [
    { pubkey: timelockSetAccount, isSigner: false, isWritable: true },
    { pubkey: votingAccount, isSigner: false, isWritable: true },
    { pubkey: votingMint, isSigner: false, isWritable: true },
    { pubkey: signatoryAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryValidationAccount, isSigner: false, isWritable: true },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: mintAuthority, isSigner: false, isWritable: false },
    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
