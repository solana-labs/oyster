import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getRealmConfigAddress,
  getTokenHoldingAddress,
  MintMaxVoteWeightSource,
  RealmConfigArgs,
} from './accounts';
import { SetRealmConfigArgs } from './instructions';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import BN from 'bn.js';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { PROGRAM_VERSION_V1 } from '../registry/constants';

export async function withSetRealmConfig(
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  realmAuthority: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityTokensToCreateGovernance: BN,
  communityVoterWeightAddin: PublicKey | undefined,
  maxCommunityVoterWeightAddin: PublicKey | undefined,
  payer: PublicKey,
) {
  const configArgs = new RealmConfigArgs({
    useCouncilMint: councilMint !== undefined,
    communityMintMaxVoteWeightSource,
    minCommunityTokensToCreateGovernance,
    useCommunityVoterWeightAddin: communityVoterWeightAddin !== undefined,
    useMaxCommunityVoterWeightAddin: maxCommunityVoterWeightAddin !== undefined,
  });

  const args = new SetRealmConfigArgs({ configArgs });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  let keys = [
    {
      pubkey: realm,
      isWritable: true,
      isSigner: false,
    },

    {
      pubkey: realmAuthority,
      isWritable: false,
      isSigner: true,
    },
  ];

  if (councilMint) {
    const councilTokenHoldingAddress = await getTokenHoldingAddress(
      programId,
      realm,
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

  if (programVersion > PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    });

    const realmConfigAddress = await getRealmConfigAddress(programId, realm);

    keys.push({
      pubkey: realmConfigAddress,
      isSigner: false,
      isWritable: true,
    });

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
      keys.push({
        pubkey: payer,
        isSigner: true,
        isWritable: true,
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
}
