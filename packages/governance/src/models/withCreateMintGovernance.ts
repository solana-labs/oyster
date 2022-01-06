import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { GovernanceConfig } from './accounts';
import { CreateMintGovernanceArgs } from './instructions';
import { SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID } from './tools/solanaSdk';

export const withCreateMintGovernance = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  realm: PublicKey,
  governedMint: PublicKey,
  config: GovernanceConfig,
  transferMintAuthority: boolean,
  mintAuthority: PublicKey,
  tokenOwnerRecord: PublicKey,
  payer: PublicKey,
  governanceAuthority: PublicKey,
): Promise<{ governanceAddress: PublicKey }> => {
  const args = new CreateMintGovernanceArgs({
    config,
    transferMintAuthority,
  });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [mintGovernanceAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('mint-governance'), realm.toBuffer(), governedMint.toBuffer()],
    programId,
  );

  const keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: mintGovernanceAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governedMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: mintAuthority,
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

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return { governanceAddress: mintGovernanceAddress };
};
