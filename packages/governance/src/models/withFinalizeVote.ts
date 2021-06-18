import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { FinalizeVoteArgs } from './instructions';

export const withFinalizeVote = async (
  instructions: TransactionInstruction[],
  governance: PublicKey,
  proposal: PublicKey,
  governingTokenMint: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new FinalizeVoteArgs();
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
      pubkey: governingTokenMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
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
