import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { CONFIG_NAME_LENGTH, GovernanceInstruction } from './governance';
import BN from 'bn.js';
import * as Layout from '../utils/layout';

///   0. `[writable]` Governance account. The account pubkey needs to be set to PDA with the following seeds:
///           1) 'governance' const prefix, 2) Governed Program account key
///   1. `[]` Account of the Program governed by this Governance account
///   2. `[]` Governance mint that this Governance uses
///   3. `[]` Council mint that this Governance uses [Optional]
export const initGovernanceInstruction = (
  governanceAccount: PublicKey,
  programAccount: PublicKey,
  governanceMint: PublicKey,
  voteThreshold: number,
  executionType: number,
  governanceType: number,
  votingEntryRule: number,
  minimumSlotWaitingPeriod: BN,
  timeLimit: BN,
  name: string,
  councilMint?: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  if (name.length > CONFIG_NAME_LENGTH) {
    throw new Error('Name is more than ' + CONFIG_NAME_LENGTH);
  }

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.u8('voteThreshold'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('governanceType'),
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
      instruction: GovernanceInstruction.InitGovernance,
      voteThreshold,
      executionType,
      governanceType,
      votingEntryRule,
      minimumSlotWaitingPeriod,
      timeLimit,
      name: nameAsBytes,
    },
    data,
  );

  const keys = [
    { pubkey: governanceAccount, isSigner: false, isWritable: true },
    { pubkey: programAccount, isSigner: false, isWritable: false },
    { pubkey: governanceMint, isSigner: false, isWritable: false },
  ];

  if (councilMint) {
    keys.push({ pubkey: councilMint, isSigner: false, isWritable: false });
  }

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
