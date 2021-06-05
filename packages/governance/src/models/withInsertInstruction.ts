import { deserializeBorsh, utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { InsertInstructionArgs } from './instructions';
import { GOVERNANCE_PROGRAM_SEED, InstructionData } from './accounts';

export const withInsertInstruction = async (
  instructions: TransactionInstruction[],
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  index: number,
  holdUpTime: number,
  instructionData: InstructionData,
  payer: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new InsertInstructionArgs({
    index,
    holdUpTime,
    instructionData,
  });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  // console.log('DATA', data.toString('hex'));

  // const datad = deserializeBorsh(
  //   GOVERNANCE_SCHEMA,
  //   InsertInstructionArgs,
  //   data,
  // );
  // console.log('DATA', datad);

  let instructionIndexBuffer = Buffer.alloc(2);
  instructionIndexBuffer.writeInt16LE(index, 0);

  const [proposalInstructionAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      instructionIndexBuffer,
    ],
    PROGRAM_IDS.governance.programId,
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
      pubkey: PROGRAM_IDS.system,
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
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );
};
