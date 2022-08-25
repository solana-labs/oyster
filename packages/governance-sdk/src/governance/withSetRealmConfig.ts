import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getRealmConfigAddress,
  getTokenHoldingAddress,
  GoverningTokenConfigAccountArgs,
  MintMaxVoteWeightSource,
} from './accounts';
import { SetRealmConfigArgs } from './instructions';
import { getGovernanceInstructionSchema } from './serialisation';
import { serialize } from 'borsh';
import BN from 'bn.js';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { PROGRAM_VERSION_V1, PROGRAM_VERSION_V3 } from '../registry/constants';
import { createRealmConfigArgs, withTokenConfigAccounts } from './tools';

export async function withSetRealmConfig(
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  realmAuthority: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityWeightToCreateGovernance: BN,
  communityTokenConfig: GoverningTokenConfigAccountArgs | undefined,
  councilTokenConfig: GoverningTokenConfigAccountArgs | undefined,
  payer: PublicKey | undefined,
) {
  const configArgs = createRealmConfigArgs(
    programVersion,
    councilMint,
    communityMintMaxVoteWeightSource,
    minCommunityWeightToCreateGovernance,
    communityTokenConfig,
    councilTokenConfig,
  );

  const args = new SetRealmConfigArgs({ configArgs });
  const data = Buffer.from(
    serialize(getGovernanceInstructionSchema(programVersion), args),
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

    withTokenConfigAccounts(keys, communityTokenConfig, councilTokenConfig);

    if (
      payer &&
      (programVersion >= PROGRAM_VERSION_V3 ||
        communityTokenConfig?.voterWeightAddin ||
        communityTokenConfig?.maxVoterWeightAddin)
    ) {
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
