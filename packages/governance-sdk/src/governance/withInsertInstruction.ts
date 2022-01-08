import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { InsertInstructionArgs } from './instructions';
import { getProposalInstructionAddress, InstructionData } from './accounts';
import { SYSTEM_PROGRAM_ID } from 'tools/solanaSdk';

export const withInsertInstruction = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  index: number,
  holdUpTime: number,
  instructionData: InstructionData,
  payer: PublicKey,
) => {
  const optionIndex = 0;

  const args = new InsertInstructionArgs({
    index,
    optionIndex: 0,
    holdUpTime,
    instructionData: instructionData,
  });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const proposalInstructionAddress = await getProposalInstructionAddress(
    programId,
    programVersion,
    proposal,
    optionIndex,
    index,
  );

  const keys = [
    {
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: proposalInstructionAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return proposalInstructionAddress;
};
