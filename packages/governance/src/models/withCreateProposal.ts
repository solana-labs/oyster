import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { CreateProposalArgs } from './instructions';
import { GOVERNANCE_PROGRAM_SEED } from './accounts';

export const withCreateProposal = async (
  instructions: TransactionInstruction[],
  realm: PublicKey,
  governance: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
  proposalIndex: number,
  payer: PublicKey,
): Promise<{ proposalAddress: PublicKey }> => {
  const PROGRAM_IDS = utils.programIds();

  const args = new CreateProposalArgs({
    name,
    descriptionLink,
    governingTokenMint,
  });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  let proposalIndexBuffer = Buffer.alloc(4);
  proposalIndexBuffer.writeInt32LE(proposalIndex, 0);

  const [proposalAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      governance.toBuffer(),
      governingTokenMint.toBuffer(),
      proposalIndexBuffer,
    ],
    PROGRAM_IDS.governance.programId,
  );

  const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const keys = [
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
      pubkey: tokenOwnerRecordAddress,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governingTokenOwner,
      isWritable: false,
      isSigner: true,
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
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
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

  return { proposalAddress };
};
