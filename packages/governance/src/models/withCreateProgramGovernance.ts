import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { GovernanceConfig } from './accounts';
import { CreateProgramGovernanceArgs } from './instructions';

export const withCreateProgramGovernance = async (
  instructions: TransactionInstruction[],
  realm: PublicKey,
  config: GovernanceConfig,
  transferUpgradeAuthority: boolean,
  programUpgradeAuthority: PublicKey,
  payer: PublicKey,
): Promise<{ governanceAddress: PublicKey }> => {
  const PROGRAM_IDS = utils.programIds();

  const args = new CreateProgramGovernanceArgs({
    config,
    transferUpgradeAuthority,
  });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [governanceAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('program-governance'),
      realm.toBuffer(),
      config.governedAccount.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const [programDataAddress] = await PublicKey.findProgramAddress(
    [config.governedAccount.toBuffer()],
    PROGRAM_IDS.bpf_upgrade_loader,
  );

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: programDataAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: programUpgradeAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: PROGRAM_IDS.bpf_upgrade_loader,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: PROGRAM_IDS.system,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );

  return { governanceAddress };
};