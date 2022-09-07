import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { serialize } from 'borsh';
import { SYSTEM_PROGRAM_ID } from '../tools';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { CreateTokenOwnerRecordArgs } from './instructions';
import { getTokenOwnerRecordAddress } from './accounts';

export const withCreateTokenOwnerRecord = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  realm: PublicKey,
  governingTokenOwner: PublicKey,
  governingTokenMint: PublicKey,
  payer: PublicKey,
): Promise<PublicKey> => {
  const args = new CreateTokenOwnerRecordArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const tokenOwnerRecordAddress = await getTokenOwnerRecordAddress(
    programId,
    realm,
    governingTokenMint,
    governingTokenOwner,
  );

  const keys = [
    { pubkey: realm, isWritable: false, isSigner: false },
    { pubkey: governingTokenOwner, isWritable: false, isSigner: false },
    { pubkey: tokenOwnerRecordAddress, isWritable: true, isSigner: false },
    { pubkey: governingTokenMint, isWritable: false, isSigner: false },
    { pubkey: payer, isWritable: true, isSigner: true },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  instructions.push(new TransactionInstruction({ keys, programId, data }));

  return tokenOwnerRecordAddress;
};
