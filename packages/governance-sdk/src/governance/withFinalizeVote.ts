import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { FinalizeVoteArgs } from './instructions';
import { PROGRAM_VERSION_V1 } from '../registry/constants';
import { withRealmConfigPluginAccounts } from './withRealmConfigPluginAccounts';

export const withFinalizeVote = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  proposalOwnerRecord: PublicKey,
  governingTokenMint: PublicKey,
  maxVoterWeightRecord?: PublicKey,
) => {
  const args = new FinalizeVoteArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [realmIsWritable, governanceIsWritable] =
    programVersion === PROGRAM_VERSION_V1 ? [false, false] : [true, true];

  let keys = [
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
      pubkey: governingTokenMint,
      isWritable: false,
      isSigner: false,
    },
  ];
  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    });
  }

  await withRealmConfigPluginAccounts(
    keys,
    programId,
    realm,
    undefined,
    maxVoterWeightRecord,
  );

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );
};
