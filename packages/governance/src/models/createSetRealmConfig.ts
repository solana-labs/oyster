import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  getTokenHoldingAddress,
  MintMaxVoteWeightSource,
  RealmConfigArgs,
} from './accounts';
import { SetRealmConfigArgs } from './instructions';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';

export async function createSetRealmConfig(
  programId: PublicKey,
  realm: PublicKey,
  realmAuthority: PublicKey,
  realmCustodian: PublicKey | undefined,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
) {
  const configArgs = new RealmConfigArgs({
    useCouncilMint: councilMint !== undefined,
    useCustodian: realmCustodian !== undefined,
    communityMintMaxVoteWeightSource,
  });

  const args = new SetRealmConfigArgs({ configArgs });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

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

  if (realmCustodian) {
    keys.push({
      pubkey: realmCustodian,
      isSigner: false,
      isWritable: false,
    });
  }

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

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
