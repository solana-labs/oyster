import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  CreateVotePercentage,
  getGovernanceSchema,
  VOTE_PERCENTAGE_SCHEMA,
} from './serialisation';
import { serialize } from 'borsh';
import { CastVoteArgs, Vote } from './instructions';
import { getTokenOwnerRecordAddress, getVoteRecordAddress } from './accounts';
import { PROGRAM_VERSION_V1 } from '../registry/constants';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { withRealmConfigAccounts } from './withRealmConfigAccounts';

export const withCastVote = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  governanceAccountRealm: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  proposalOwnerRecord: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  governingTokenMint: PublicKey,
  communityMint: PublicKey,
  realmPublicKey: PublicKey,
  vote: Vote,
  votePercentage: number,
  payer: PublicKey,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
  communityVoterWeightAddin?: PublicKey,
) => {
  const args = new CastVoteArgs(
    programVersion === PROGRAM_VERSION_V1
      ? { yesNoVote: vote.toYesNoVote(), vote: undefined }
      : { yesNoVote: undefined, vote: vote },
  );
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const voteRecordAddress = await getVoteRecordAddress(
    programId,
    proposal,
    tokenOwnerRecord,
  );

  const [realmIsWritable, governanceIsWritable] =
    programVersion === PROGRAM_VERSION_V1 ? [false, false] : [true, true];

  const keys = [
    {
      pubkey: governanceAccountRealm,
      isWritable: realmIsWritable,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: governanceIsWritable,
      isSigner: false,
    },
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
      pubkey: tokenOwnerRecord,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: voteRecordAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ];

  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push(
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isWritable: false,
        isSigner: false,
      },
      {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    );
  }

  await withRealmConfigAccounts(
    keys,
    programId,
    governanceAccountRealm,
    voterWeightRecord,
    maxVoterWeightRecord,
  );

  if (communityVoterWeightAddin) {
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
        data: Buffer.from(serialize(VOTE_PERCENTAGE_SCHEMA, addinValue)),
      }),
    );
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return voteRecordAddress;
};
