import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as Layout from '../utils/layout';

import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';
import BN from 'bn.js';

/// [Requires Voting tokens]
/// Burns voting tokens, indicating you approve of running this set of transactions. If you tip the consensus,
/// then the transactions begin to be run at their time slots.
///
///   0. `[writable]` Timelock set account.
///   1. `[writable]` Voting account.
///   2. `[writable]` Voting mint account.
///   3. `[]` Transfer authority
///   4. `[]` Timelock program mint authority
///   5. `[]` Timelock program account pub key.
///   6. `[]` Token program account.
export const voteInstruction = (
  timelockSetAccount: PublicKey,
  votingAccount: PublicKey,
  votingMint: PublicKey,
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
      instruction: TimelockInstruction.Vote,
      votingTokenAmount: new BN(votingTokenAmount),
    },
    data,
  );

  const keys = [
    { pubkey: timelockSetAccount, isSigner: false, isWritable: true },
    { pubkey: votingAccount, isSigner: false, isWritable: true },
    { pubkey: votingMint, isSigner: false, isWritable: true },
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
