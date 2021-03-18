import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';

/// [Requires Admin token]
/// Removes a signer from the set.
///
///   0. `[writable]` Signatory account to remove token from.
///   1. `[writable]` Signatory mint account.
///   2. `[writable]` Admin account.
///   3. `[writable]` Admin validation account.
///   4. `[]` Timelock set account.
///   5. `[]` Transfer authority
///   5. `[]` Timelock program mint authority
///   6. `[]` Timelock program account.
///   7. '[]` Token program id.
export const removeSignerInstruction = (
  signatoryAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  adminAccount: PublicKey,
  adminValidationAccount: PublicKey,
  timelockSetAccount: PublicKey,
  transferAuthority: PublicKey,
  mintAuthority: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.RemoveSigner,
    },
    data,
  );

  const keys = [
    { pubkey: signatoryAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryMintAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: false, isWritable: true },
    { pubkey: adminValidationAccount, isSigner: false, isWritable: true },
    { pubkey: timelockSetAccount, isSigner: false, isWritable: true },
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
