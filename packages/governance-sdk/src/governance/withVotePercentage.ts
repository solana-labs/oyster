import { CreateVotePercentage, VOTE_PERCENTAGE_SCHEMA } from './serialisation';
import { getTokenOwnerRecordAddress } from './accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { serialize } from 'borsh';

export const VOTE_PERCENTAGE_MAX = 10_000;

export const withVotePercentage = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  governingTokenMint: PublicKey,
  realmPublicKey: PublicKey,
  communityMint: PublicKey,
  payer: PublicKey,
  voterWeightRecord: PublicKey,
  communityVoterWeightAddin: PublicKey,
  votePercentage: number = VOTE_PERCENTAGE_MAX,
) => {
  const addinValue = new CreateVotePercentage({
    vote_percentage: votePercentage,
  });

  const governingOwnerRecord = await getTokenOwnerRecordAddress(
    programId,
    realmPublicKey,
    governingTokenMint,
    payer,
  );

  // fixed_weight_addin
  const addinKeys = [
    // 0. `[]` Governing Token mint
    {
      pubkey: communityMint,
      isWritable: false,
      isSigner: false,
    },
    // 1. `[]` Governing token owner
    {
      pubkey: payer,
      isWritable: false,
      isSigner: false,
    },
    // 2. `[signer]` Authority account
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    // 3. `[]` The Governance program account
    {
      pubkey: programId,
      isWritable: false,
      isSigner: false,
    },
    // 4. `[]` Realm account
    {
      pubkey: realmPublicKey,
      isWritable: false,
      isSigner: false,
    },
    // 5. `[]` Governing Owner Record. PDA seeds (governance program): ['governance', realm, token_mint, token_owner]
    {
      pubkey: governingOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    // 6. `[writable]` VoterWeightRecord
    {
      pubkey: voterWeightRecord!,
      isWritable: true,
      isSigner: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys: addinKeys,
      programId: communityVoterWeightAddin,
      data: Buffer.from([
        2,
        ...serialize(VOTE_PERCENTAGE_SCHEMA, addinValue),
      ]),
    }),
  );
};
