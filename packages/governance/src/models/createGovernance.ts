import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GOVERNANCE_NAME_LENGTH, GovernanceInstruction } from './governance';
import BN from 'bn.js';
import * as Layout from '../utils/layout';

///   0. `[writable]` Governance account. The account pubkey needs to be set to PDA with the following seeds:
///           1) 'governance' const prefix, 2) Governed Program account key
///   1. `[]` Account of the Program governed by this Governance account
///   2. `[writable]` Program Data account of the Program governed by this Governance account
///   3. `[signer]` Current Upgrade Authority account of the Program governed by this Governance account
///   4. `[]` Governance mint that this Governance uses
///   5. `[signer]` Payer
///   6. `[]` System account.
///   7. `[]` bpf_upgrade_loader account.
///   8. `[]` Council mint that this Governance uses [Optional]
export const createGovernanceInstruction = (
  governanceAccount: PublicKey,
  governedProgramAccount: PublicKey,
  governedProgramDataAccount: PublicKey,
  governedProgramUpgradeAuthority: PublicKey,
  governanceMint: PublicKey,
  voteThreshold: number,
  executionType: number,
  governanceType: number,
  votingEntryRule: number,
  minimumSlotWaitingPeriod: BN,
  timeLimit: BN,
  name: string,
  payer: PublicKey,
  councilMint?: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  if (name.length > GOVERNANCE_NAME_LENGTH) {
    throw new Error('Name is more than ' + GOVERNANCE_NAME_LENGTH);
  }

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    BufferLayout.u8('voteThreshold'),
    BufferLayout.u8('executionType'),
    BufferLayout.u8('governanceType'),
    BufferLayout.u8('votingEntryRule'),
    Layout.uint64('minimumSlotWaitingPeriod'),
    Layout.uint64('timeLimit'),
    BufferLayout.seq(BufferLayout.u8(), GOVERNANCE_NAME_LENGTH, 'name'),
  ]);

  const nameAsBytes = utils.toUTF8Array(name);
  for (let i = nameAsBytes.length; i <= GOVERNANCE_NAME_LENGTH - 1; i++) {
    nameAsBytes.push(0);
  }

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.CreateGovernance,
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
    { pubkey: governedProgramAccount, isSigner: false, isWritable: false },
    { pubkey: governedProgramDataAccount, isSigner: false, isWritable: true },
    {
      pubkey: governedProgramUpgradeAuthority,
      isSigner: true,
      isWritable: false,
    },
    { pubkey: governanceMint, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: false },
    { pubkey: PROGRAM_IDS.system, isSigner: false, isWritable: false },
    {
      pubkey: PROGRAM_IDS.bpf_upgrade_loader,
      isSigner: false,
      isWritable: false,
    },
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
