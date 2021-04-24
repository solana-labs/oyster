import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';

///   0. `[]` Timelock config key. Needs to be set with pubkey set to PDA with seeds of the
///           program account key, governance mint key, council mint key, and timelock program account key.
///   1. `[]` Program account to tie this config to.
///   2. `[]` Governance mint to tie this config to
///   3. `[]` Payer
///   4. `[]` Timelock program pub key.
///   5. `[]` System account.
///   6. `[]` Council mint [optional] to tie this config to [Optional]
export const createEmptyTimelockConfigInstruction = (
  timelockConfigAccount: PublicKey,
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
      instruction: TimelockInstruction.CreateEmptyTimelockConfig,
    },
    data,
  );

  const keys = [
    { pubkey: timelockConfigAccount, isSigner: false, isWritable: false },
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
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
