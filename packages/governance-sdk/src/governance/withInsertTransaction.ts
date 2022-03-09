import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { InsertTransactionArgs } from './instructions';
import { getProposalTransactionAddress, InstructionData } from './accounts';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { PROGRAM_VERSION_V1, PROGRAM_VERSION_V2 } from '../registry/constants';

export const withInsertTransaction = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  index: number,
  optionIndex: number,
  holdUpTime: number,
  transactionInstructions: InstructionData[],
  payer: PublicKey,
) => {
  const args = new InsertTransactionArgs({
    index,
    optionIndex,
    holdUpTime,
    instructionData:
      programVersion === PROGRAM_VERSION_V1
        ? transactionInstructions[0]
        : undefined,
    instructions:
      programVersion >= PROGRAM_VERSION_V2
        ? transactionInstructions
        : undefined,
  });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const proposalTransactionAddress = await getProposalTransactionAddress(
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
      pubkey: proposalTransactionAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: true,
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

  return proposalTransactionAddress;
};
