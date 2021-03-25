import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { CONFIG_NAME_LENGTH, TimelockInstruction } from './timelock';
import BN from 'bn.js';
import * as Layout from '../utils/layout';

///   0. `[writable]` Timelock config key. Needs to be set with pubkey set to PDA with seeds of the
///           program account key, governance mint key, council mint key, and timelock program account key.
///   1. `[]` Program account to tie this config to.
///   2. `[]` Governance mint to tie this config to
///   3. `[]` Council mint [optional] to tie this config to [Pass in 0s otherwise]
///   4. `[]` Payer
///   5. `[]` Timelock program account pub key.
///   6. `[]` Timelock program pub key. Different from program account - is the actual id of the executable.
///   7. `[]` Token program account.
///   8. `[]` System account.
export const createEmptyTimelockConfigInstruction = (
  timelockConfigAccount: PublicKey,
  programAccount: PublicKey,
  governanceMint: PublicKey,
  councilMint: PublicKey,
  payer: PublicKey,
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
    { pubkey: governanceMint, isSigner: false, isWritable: false },
    { pubkey: councilMint, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: false },

    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.timelock.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
    { pubkey: PROGRAM_IDS.system, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
