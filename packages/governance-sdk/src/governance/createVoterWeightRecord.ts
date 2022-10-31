import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { serialize } from 'borsh';
import { getVoterWeightRecordAddress } from '../addins';
import { SYSTEM_PROGRAM_ID } from '../tools';
import { GOVERNANCE_SCHEMA } from './serialisation';
import {
  CreateVoterWeightRecordFixedArgs,
  CreateVoterWeightRecordVestingArgs,
} from './instructions';

export async function createVoterWeightRecordByVestingAddin(
  instructions: TransactionInstruction[],
  programId: PublicKey,
  addinId: PublicKey,
  // Accounts
  realm: PublicKey,
  governingTokenMint: PublicKey,
  wallet: PublicKey,
  payer: PublicKey,
): Promise<PublicKey> {
  const voterWeightRecord = await getVoterWeightRecordAddress(
    addinId,
    realm,
    governingTokenMint,
    wallet,
  );

  const args = new CreateVoterWeightRecordVestingArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  // vesting
  const keys = [
    { pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false },
    { pubkey: wallet, isWritable: false, isSigner: false },
    { pubkey: payer, isWritable: false, isSigner: true },
    { pubkey: realm, isWritable: false, isSigner: false },
    { pubkey: governingTokenMint, isWritable: false, isSigner: false },
    { pubkey: voterWeightRecord, isWritable: true, isSigner: false },
  ];

  instructions.push(
    new TransactionInstruction({
      programId: addinId,
      keys,
      data: Buffer.from(data),
    }),
  );

  return voterWeightRecord;
}

export async function createVoterWeightRecordByFixedAddin(
  programId: PublicKey,
  addinId: PublicKey,
  // Accounts
  realm: PublicKey,
  governing_token_mint: PublicKey,
  governing_token_owner: PublicKey,
  wallet: PublicKey,
  payer: PublicKey,
): Promise<TransactionInstruction> {
  const voter_weight_record = await getVoterWeightRecordAddress(
    addinId,
    realm,
    governing_token_mint,
    wallet,
  );

  const args = new CreateVoterWeightRecordFixedArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  // fixed
  const keys = [
    { pubkey: realm, isWritable: false, isSigner: false },
    { pubkey: governing_token_mint, isWritable: false, isSigner: false },
    { pubkey: governing_token_owner, isWritable: false, isSigner: false },
    { pubkey: voter_weight_record, isWritable: true, isSigner: false },
    { pubkey: payer, isWritable: true, isSigner: true },
    { pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false },
  ];

  console.log(keys.map(k => ({ ...k, pubkey: k.pubkey.toBase58() })));

  return new TransactionInstruction({
    keys,
    programId: addinId,
    data: Buffer.from(data),
  });
}
