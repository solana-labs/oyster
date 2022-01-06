import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { CreateProposalArgs } from './instructions';
import { GOVERNANCE_PROGRAM_SEED, VoteType } from './accounts';
import { PROGRAM_VERSION_V1 } from './registry/api';
import { SYSTEM_PROGRAM_ID } from './tools/solanaSdk';

export const withCreateProposal = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  tokenOwnerRecord: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  governanceAuthority: PublicKey,
  proposalIndex: number,
  voteType: VoteType,
  options: string[],
  useDenyOption: boolean,
  payer: PublicKey,
) => {
  const args = new CreateProposalArgs({
    name,
    descriptionLink,
    governingTokenMint,
    voteType,
    options,
    useDenyOption,
  });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  let proposalIndexBuffer = Buffer.alloc(4);
  proposalIndexBuffer.writeInt32LE(proposalIndex, 0);

  const [proposalAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      governance.toBuffer(),
      governingTokenMint.toBuffer(),
      proposalIndexBuffer,
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
      pubkey: proposalAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: true,
      isSigner: false,
    },
    ...(programVersion > PROGRAM_VERSION_V1
      ? [
          {
            pubkey: governingTokenMint,
            isWritable: false,
            isSigner: false,
          },
        ]
      : []),
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
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
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return proposalAddress;
};
