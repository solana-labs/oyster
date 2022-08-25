import {
  AccountMeta,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceInstructionSchema } from './serialisation';
import { serialize } from 'borsh';
import { CancelProposalArgs } from './instructions';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export const withCancelProposal = (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  proposalOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
) => {
  const args = new CancelProposalArgs();
  const data = Buffer.from(
    serialize(getGovernanceInstructionSchema(programVersion), args),
  );

  let keys: AccountMeta[] = [];

  if (programVersion > PROGRAM_VERSION_V1) {
    keys.push(
      {
        pubkey: realm,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: governance,
        isWritable: true,
        isSigner: false,
      },
    );
  }

  keys.push(
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
  );

  if (programVersion == PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
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
