import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { CreateRealmArgs } from './instructions';
import { GOVERNANCE_PROGRAM_SEED } from './accounts';

export const withCreateRealm = async (
  instructions: TransactionInstruction[],
  name: string,
  communityMint: PublicKey,
  payer: PublicKey,
  councilMint?: PublicKey,
): Promise<{ realmAddress: PublicKey }> => {
  const PROGRAM_IDS = utils.programIds();

  const args = new CreateRealmArgs({ name });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [realmAddress] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), Buffer.from(args.name)],
    PROGRAM_IDS.governance.programId,
  );

  const [communityTokenHoldingAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realmAddress.toBuffer(),
      communityMint.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  let keys = [
    {
      pubkey: realmAddress,
      isSigner: false,
      isWritable: true,
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
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.system,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: PROGRAM_IDS.token,
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
    const [councilTokenHoldingAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from(GOVERNANCE_PROGRAM_SEED),
        realmAddress.toBuffer(),
        councilMint.toBuffer(),
      ],
      PROGRAM_IDS.governance.programId,
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

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );

  return { realmAddress };
};
