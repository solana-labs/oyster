import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { ExecuteInstructionArgs } from './instructions';
import { InstructionData } from './accounts';

export const withExecuteInstruction = async (
  instructions: TransactionInstruction[],
  governance: PublicKey,
  proposal: PublicKey,
  instructionAddress: PublicKey,
  instruction: InstructionData,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new ExecuteInstructionArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  let keys = [
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
      pubkey: instructionAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: instruction.programId,
      isWritable: false,
      isSigner: false,
    },
  ];

  for (let accountMeta of instruction.accounts) {
    keys.push({
      pubkey: accountMeta.pubkey,
      isWritable: accountMeta.isWritable,
      isSigner: accountMeta.isSigner,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );
};
