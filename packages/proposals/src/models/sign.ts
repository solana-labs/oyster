import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './governance';

/// [Requires Signatory token]
/// Burns signatory token, indicating you approve of moving this Proposal from Draft state to Voting state.
/// The last Signatory token to be burned moves the state to Voting.
///
///   0. `[writable]` Proposal state account pub key.
///   1. `[writable]` Signatory account
///   2. `[writable]` Signatory mint account.
///   3. `[]` Proposal account pub key.
///   4. `[]` Transfer authority
///   5. `[]` Governance mint authority (pda of seed Proposal key)
///   7. `[]` Token program account.
///   8. `[]` Clock sysvar.
export const signInstruction = (
  proposalStateAccount: PublicKey,
  signatoryAccount: PublicKey,
  signatoryMintAccount: PublicKey,
  proposalAccount: PublicKey,
  transferAuthority: PublicKey,
  mintAuthority: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.Sign,
    },
    data,
  );

  const keys = [
    { pubkey: proposalStateAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryAccount, isSigner: false, isWritable: true },
    { pubkey: signatoryMintAccount, isSigner: false, isWritable: true },
    { pubkey: proposalAccount, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },
    { pubkey: mintAuthority, isSigner: false, isWritable: false },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
