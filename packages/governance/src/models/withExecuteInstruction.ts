import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { ExecuteInstructionArgs } from './instructions';
import { AccountMetaData, InstructionData } from './accounts';

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

  // When an instruction needs to be signed by the Governance PDA then it has to be removed from AccountMeta
  // because it'll be done during execution using invoke_signed() and not when we send ExecuteInstruction
  instruction.accounts = instruction.accounts.map(a =>
    a.pubkey.toBase58() === governance.toBase58() && a.isSigner
      ? new AccountMetaData({
          pubkey: a.pubkey,
          isWritable: a.isWritable,
          isSigner: false,
        })
      : a,
  );

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
    ...instruction.accounts,
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );
};
