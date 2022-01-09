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

export async function createSetRealmConfig(
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  realmAuthority: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityTokensToCreateGovernance: BN,
  communityVoterWeightAddin: PublicKey | undefined,
  payer: PublicKey,
) {
  const configArgs = new RealmConfigArgs({
    useCouncilMint: councilMint !== undefined,
    communityMintMaxVoteWeightSource,
    minCommunityTokensToCreateGovernance,
    useCommunityVoterWeightAddin: communityVoterWeightAddin !== undefined,
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

  if (programVersion > 1) {
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
        pubkey: payer,
        isSigner: true,
        isWritable: true,
      });
      keys.push({
        pubkey: communityVoterWeightAddin,
        isWritable: false,
        isSigner: false,
      });
    }
  }

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
