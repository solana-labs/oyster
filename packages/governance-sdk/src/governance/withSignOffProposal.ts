import {
  AccountMeta,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_INSTRUCTION_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { SignOffProposalArgs } from './instructions';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export const withSignOffProposal = (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  signatory: PublicKey,
  signatoryRecord: PublicKey | undefined,
  proposalOwnerRecord: PublicKey | undefined,
) => {
  const args = new SignOffProposalArgs();
  const data = Buffer.from(serialize(GOVERNANCE_INSTRUCTION_SCHEMA, args));

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

  keys.push({
    pubkey: proposal,
    isWritable: true,
    isSigner: false,
  });

  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push(
      {
        pubkey: signatoryRecord!,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: signatory,
        isWritable: false,
        isSigner: true,
      },
      {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    );
  } else {
    keys.push({
      pubkey: signatory,
      isWritable: false,
      isSigner: true,
    });

    if (proposalOwnerRecord) {
      keys.push({
        pubkey: proposalOwnerRecord,
        isWritable: false,
        isSigner: false,
      });
    } else {
      keys.push({
        pubkey: signatoryRecord!,
        isWritable: true,
        isSigner: false,
      });
    }
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};
