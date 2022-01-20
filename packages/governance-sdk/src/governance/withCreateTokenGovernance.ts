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
import { withVoterWeightAccounts } from './withVoterWeightAccounts';

export const withCreateTokenGovernance = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  realm: PublicKey,
  governedToken: PublicKey,
  config: GovernanceConfig,
  transferTokenOwner: boolean,
  tokenOwner: PublicKey,
  tokenOwnerRecord: PublicKey,
  payer: PublicKey,
  governanceAuthority: PublicKey,
  voterWeightRecord?: PublicKey,
) => {
  const args = new CreateTokenGovernanceArgs({
    config,
    transferTokenOwner,
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
      isWritable: false,
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
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
  ];

  withVoterWeightAccounts(keys, programId, realm, voterWeightRecord);

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return governanceAddress;
};
