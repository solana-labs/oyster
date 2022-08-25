import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getGovernanceInstructionSchema } from './serialisation';
import { serialize } from 'borsh';
import { CreateNativeTreasuryArgs } from './instructions';
import { getNativeTreasuryAddress } from './accounts';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';

export const withCreateNativeTreasury = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  governancePk: PublicKey,
  payer: PublicKey,
) => {
  const args = new CreateNativeTreasuryArgs();
  const data = Buffer.from(
    serialize(getGovernanceInstructionSchema(programVersion), args),
  );

  const nativeTreasuryAddress = await getNativeTreasuryAddress(
    programId,
    governancePk,
  );

  const keys = [
    {
      pubkey: governancePk,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: nativeTreasuryAddress,
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

  return nativeTreasuryAddress;
};
