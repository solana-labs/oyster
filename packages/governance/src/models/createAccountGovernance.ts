import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  CreateAccountGovernanceArgs,
  GovernanceConfig,
  GOVERNANCE_SCHEMA,
} from './governance';
import { serialize } from 'borsh';

export const createAccountGovernance = async (
  instructions: TransactionInstruction[],
  realm: PublicKey,
  config: GovernanceConfig,
  payer: PublicKey,
): Promise<{ governanceAddress: PublicKey }> => {
  const PROGRAM_IDS = utils.programIds();

  const args = new CreateAccountGovernanceArgs({ config });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [governanceAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('account-governance'),
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
      pubkey: governanceAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
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
