import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { GovernanceConfig } from './accounts';
import { CreateTokenGovernanceArgs } from './instructions';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { TOKEN_PROGRAM_ID } from '../tools/sdk/splToken';
import { withRealmConfigAccounts } from './withRealmConfigAccounts';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export const withCreateTokenGovernance = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governedToken: PublicKey,
  config: GovernanceConfig,
  transferAccountAuthorities: boolean,
  tokenOwner: PublicKey,
  tokenOwnerRecord: PublicKey,
  payer: PublicKey,
  governanceAuthority: PublicKey,
  voterWeightRecord?: PublicKey,
) => {
  const args = new CreateTokenGovernanceArgs({
    config,
    transferTokenOwner: transferAccountAuthorities,
  });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [governanceAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('token-governance'),
      realm.toBuffer(),
      governedToken.toBuffer(),
    ],
    programId,
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
      pubkey: governedToken,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwner,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
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
    pubkey: governanceAuthority,
    isWritable: false,
    isSigner: true,
  });

  await withRealmConfigAccounts(keys, programId, realm, voterWeightRecord);

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return governanceAddress;
};
