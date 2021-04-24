import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './governance';

///   0. `[]` Governance account. The account pubkey needs to be set to PDA with the following seeds:
///           1) 'governance' const prefix, 2) Governed Program account key
///   1. `[]` Account of the Program governed by this Governance account
///   2. `[writable]` Program Data account of the Program governed by this Governance account
///   3. `[signer]` Current Upgrade Authority account of the Program governed by this Governance account
///   4. `[signer]` Payer
///   5. `[]` System account.
///   6. `[]` bpf_upgrade_loader account.
export const createEmptyGovernanceInstruction = (
  governanceAccount: PublicKey,
  programAccount: PublicKey,
  programDataAccount: PublicKey,
  programUpgradeAuthority: PublicKey,
  governanceMint: PublicKey,
  payer: PublicKey,
  councilMint?: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.CreateEmptyGovernance,
    },
    data,
  );

  const keys = [
    { pubkey: governanceAccount, isSigner: false, isWritable: false },
    { pubkey: programAccount, isSigner: false, isWritable: false },
    { pubkey: programDataAccount, isSigner: false, isWritable: true },
    { pubkey: programUpgradeAuthority, isSigner: true, isWritable: false },

    { pubkey: payer, isSigner: true, isWritable: false },
    { pubkey: PROGRAM_IDS.system, isSigner: false, isWritable: false },
    {
      pubkey: PROGRAM_IDS.bpf_upgrade_loader,
      isSigner: false,
      isWritable: false,
    },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
