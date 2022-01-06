import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { UpdateProgramMetadataArgs } from './instructions';
import { getProgramMetadataAddress } from './accounts';
import { SYSTEM_PROGRAM_ID } from './tools/solanaSdk';

export const withUpdateProgramMetadata = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,

  payer: PublicKey,
) => {
  const args = new UpdateProgramMetadataArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const programMetadataAddress = await getProgramMetadataAddress(programId);

  const keys = [
    {
      pubkey: programMetadataAddress,
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
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};
