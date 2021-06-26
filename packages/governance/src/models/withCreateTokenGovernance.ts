import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { GovernanceConfig } from './accounts';
import { CreateTokenGovernanceArgs } from './instructions';

export const withCreateTokenGovernance = async (
  instructions: TransactionInstruction[],
  realm: PublicKey,
  config: GovernanceConfig,
  transferTokenOwner: boolean,
  tokenOwner: PublicKey,
  payer: PublicKey,
): Promise<{ governanceAddress: PublicKey }> => {
  const PROGRAM_IDS = utils.programIds();

  const args = new CreateTokenGovernanceArgs({
    config,
    transferTokenOwner,
  });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [tokenGovernanceAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('token-governance'),
      realm.toBuffer(),
      config.governedAccount.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: tokenGovernanceAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: config.governedAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwner,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: PROGRAM_IDS.token,
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

  return { governanceAddress: tokenGovernanceAddress };
};
