import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';

/// [Requires Signatory token]
/// Burns signatory token, indicating you approve of moving this Timelock set from Draft state to Voting state.
/// The last Signatory token to be burned moves the state to Voting.
///
///   0. `[writable]` Timelock set account pub key.
///   1. `[writable]` Signatory account
///   2. `[writable]` Signatory mint account.
///   3. `[]` Transfer authority
///   4. `[]` Timelock mint authority
///   5. `[]` Timelock program account pub key.
///   6. `[]` Token program account.
export const signInstruction = (
  timelockSetAccount: PublicKey,
  signatoryAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  transferAuthority: PublicKey,
  mintAuthority: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.Sign,
    },
    data,
  );

  const keys = [
    { pubkey: timelockSetAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryMintAccount, isSigner: false, isWritable: true },
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
