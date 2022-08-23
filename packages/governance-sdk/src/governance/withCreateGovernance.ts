import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { GovernanceConfig } from './accounts';
import { CreateGovernanceArgs } from './instructions';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { withRealmConfigPluginAccounts } from './withRealmConfigPluginAccounts';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export const withCreateGovernance = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governedAccount: PublicKey | undefined,
  config: GovernanceConfig,
  tokenOwnerRecord: PublicKey,
  payer: PublicKey,
  createAuthority: PublicKey,
  voterWeightRecord?: PublicKey,
) => {
  const args = new CreateGovernanceArgs({ config });

  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  governedAccount = governedAccount ?? new Keypair().publicKey;

  const [governanceAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('account-governance'),
      realm.toBuffer(),
      governedAccount.toBuffer(),
    ],
    programId,
  );

  let keys = [
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
      pubkey: governedAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    });
  }

  keys.push({
    pubkey: createAuthority,
    isWritable: false,
    isSigner: true,
  });

  await withRealmConfigPluginAccounts(
    keys,
    programId,
    realm,
    voterWeightRecord,
  );

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return governanceAddress;
};
