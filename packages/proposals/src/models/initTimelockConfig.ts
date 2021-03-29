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
///           program account key, governance mint key, council mint key, timelock program account key.
///   1. `[]` Program account that this config uses
///   2. `[]` Governance mint that this config uses
///   3. `[]` Council mint that this config uses [Optional] [Pass in 0s otherwise]
///   4. `[]` Timelock program account pub key.
///   5. `[]` Token program account.
export const initTimelockConfigInstruction = (
  timelockConfigAccount: PublicKey,
  programAccount: PublicKey,
  governanceMint: PublicKey,
  councilMint: PublicKey,
  consensusAlgorithm: number,
  executionType: number,
  timelockType: number,
  votingEntryRule: number,
  minimumSlotWaitingPeriod: BN,
  timeLimit: BN,
  name: string,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  if (name.length > CONFIG_NAME_LENGTH) {
    throw new Error('Name is more than ' + CONFIG_NAME_LENGTH);
  }

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.u8('consensusAlgorithm'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('timelockType'),
    BufferLayout.u8('votingEntryRule'),
    Layout.uint64('minimumSlotWaitingPeriod'),
    Layout.uint64('timeLimit'),
    BufferLayout.seq(BufferLayout.u8(), CONFIG_NAME_LENGTH, 'name'),
  ]);

  const nameAsBytes = utils.toUTF8Array(name);
  for (let i = nameAsBytes.length; i <= CONFIG_NAME_LENGTH - 1; i++) {
    nameAsBytes.push(0);
  }

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.InitTimelockConfig,
      consensusAlgorithm,
      executionType,
      timelockType,
      votingEntryRule,
      minimumSlotWaitingPeriod,
      timeLimit,
      name: nameAsBytes,
    },
    data,
  );

  const keys = [
    { pubkey: timelockConfigAccount, isSigner: false, isWritable: true },
    { pubkey: programAccount, isSigner: false, isWritable: false },
    { pubkey: governanceMint, isSigner: false, isWritable: false },
    { pubkey: councilMint, isSigner: false, isWritable: false },
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
