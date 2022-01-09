import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { CancelProposalArgs } from './instructions';
import { PROGRAM_VERSION_V1 } from '../registry/api';

export const withCancelProposal = (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  proposal: PublicKey,
  proposalOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  governance: PublicKey,
) => {
  const args = new CancelProposalArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  let keys = [
    {
      pubkey: proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: proposalOwnerRecord,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  if (programVersion > PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};
