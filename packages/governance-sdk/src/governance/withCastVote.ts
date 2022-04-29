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
import { getVoteRecordAddress } from './accounts';
import { PROGRAM_VERSION_V1 } from '../registry/constants';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { withRealmConfigAccounts } from './withRealmConfigAccounts';

export const withCastVote = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  proposalOwnerRecord: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  governingTokenMint: PublicKey,
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
      pubkey: realm,
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
    realm,
    voterWeightRecord,
    maxVoterWeightRecord,
  );

  if (communityVoterWeightAddin) {
    const addinValue = new CreateVotePercentage({
      vote_percentage: votePercentage,
    });

    // https://github.com/neonlabsorg/neon-spl-governance/blob/main/addin-vesting/program/src/instruction.rs#L101-L116
    const addinKeys = [
      // 0. `[]` The Vesting account. PDA seeds: [vesting spl-token account]
      // {
      //   pubkey: realm,
      //   isWritable: false,
      //   isSigner: false,
      // },
      // 1. `[]` The Vesting Owner account
      // {
      //   pubkey: realm,
      //   isWritable: false,
      //   isSigner: false,
      // },
      // 2. `[signer]` The Vesting Authority account
      // {
      //   pubkey: realm,
      //   isWritable: false,
      //   isSigner: true,
      // },
      // 3. `[]` The Governance program account
      {
        pubkey: governance,
        isWritable: false,
        isSigner: false,
      },
      // 4. `[]` The Realm account
      {
        pubkey: realm,
        isWritable: false,
        isSigner: false,
      },
      // 5. `[]` Governing Owner Record. PDA seeds (governance program): ['governance', realm, token_mint, vesting_owner]
      // {
      //   pubkey: realm,
      //   isWritable: false,
      //   isSigner: false,
      // },
      // 6. `[writable]` The VoterWeight Record. PDA seeds: ['voter_weight', realm, token_mint, vesting_owner]
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
