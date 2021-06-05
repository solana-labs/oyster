import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { ExecuteInstructionArgs } from './instructions';

export const withExecuteInstruction = async (
  instructions: TransactionInstruction[],
  governance: PublicKey,
  proposal: PublicKey,
  proposalInstruction: PublicKey,
  instructionProgram: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new ExecuteInstructionArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

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
      pubkey: proposalInstruction,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: instructionProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: new PublicKey('4x59EZfiJqQdF4sxuH7ppKcuaHksoQsADrjQ7VUHgdJJ'),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: new PublicKey('SysvarFees111111111111111111111111111111111'),
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );
};
