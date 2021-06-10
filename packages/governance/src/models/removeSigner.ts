import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './governance';

/// [Requires Admin token]
/// Removes a signer from the set.
///
///   0. `[writable]` Signatory account to remove token from.
///   1. `[writable]` Signatory mint account.
///   2. `[writable]` Admin account.
///   3. `[writable]` Admin validation account.
///   4. `[writable]` Proposal state account.
///   5. `[]` Proposal account.
///   6. `[]` Transfer authority
///   7. `[]` Governance program mint authority (pda of seed with Proposal key)
///   8. '[]` Token program id.
export const removeSignerInstruction = (
  signatoryAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  adminAccount: PublicKey,
  adminValidationAccount: PublicKey,
  proposalAccount: PublicKey,
  transferAuthority: PublicKey,
  mintAuthority: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.RemoveSigner,
    },
    data,
  );

  const keys = [
    { pubkey: signatoryAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryMintAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: false, isWritable: true },
    { pubkey: adminValidationAccount, isSigner: false, isWritable: true },
    { pubkey: proposalAccount, isSigner: false, isWritable: true },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: mintAuthority, isSigner: false, isWritable: false },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
