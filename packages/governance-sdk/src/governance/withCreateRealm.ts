import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { CreateRealmArgs } from './instructions';
import {
  RealmConfigArgs,
  GOVERNANCE_PROGRAM_SEED,
  MintMaxVoteWeightSource,
  getTokenHoldingAddress,
  getRealmConfigAddress,
} from './accounts';
import BN from 'bn.js';
import { PROGRAM_VERSION_V2 } from '../registry/constants';
import { SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../tools/sdk';

export async function withCreateRealm(
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  name: string,
  realmAuthority: PublicKey,
  communityMint: PublicKey,
  payer: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityWeightToCreateGovernance: BN,
  communityVoterWeightAddin?: PublicKey | undefined,
  maxCommunityVoterWeightAddin?: PublicKey | undefined,
) {
  if (communityVoterWeightAddin && programVersion < PROGRAM_VERSION_V2) {
    throw new Error(
      `Voter weight addin is not supported in version ${programVersion}`,
    );
  }

  const configArgs = new RealmConfigArgs({
    useCouncilMint: councilMint !== undefined,
    minCommunityTokensToCreateGovernance: minCommunityWeightToCreateGovernance,
    communityMintMaxVoteWeightSource,
    useCommunityVoterWeightAddin: communityVoterWeightAddin !== undefined,
    useMaxCommunityVoterWeightAddin: maxCommunityVoterWeightAddin !== undefined,
  });

  const args = new CreateRealmArgs({
    configArgs,
    name,
  });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  const [realmAddress] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), Buffer.from(args.name)],
    programId,
  );

  const communityTokenHoldingAddress = await getTokenHoldingAddress(
    programId,
    realmAddress,
    communityMint,
  );

  let keys = [
    {
      pubkey: realmAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: realmAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: communityMint,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: communityTokenHoldingAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  if (councilMint) {
    const councilTokenHoldingAddress = await getTokenHoldingAddress(
      programId,
      realmAddress,
      councilMint,
    );

    keys = [
      ...keys,
      {
        pubkey: councilMint,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: councilTokenHoldingAddress,
        isSigner: false,
        isWritable: true,
      },
    ];
  }

  if (communityVoterWeightAddin) {
    keys.push({
      pubkey: communityVoterWeightAddin,
      isWritable: false,
      isSigner: false,
    });
  }

  if (maxCommunityVoterWeightAddin) {
    keys.push({
      pubkey: maxCommunityVoterWeightAddin,
      isWritable: false,
      isSigner: false,
    });
  }

  if (communityVoterWeightAddin || maxCommunityVoterWeightAddin) {
    const realmConfigAddress = await getRealmConfigAddress(
      programId,
      realmAddress,
    );

    keys.push({
      pubkey: realmConfigAddress,
      isSigner: false,
      isWritable: true,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return realmAddress;
}
