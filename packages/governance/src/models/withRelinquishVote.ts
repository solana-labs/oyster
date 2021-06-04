import { utils } from '@oyster/common';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { CastVoteArgs, RelinquishVoteArgs, Vote } from './instructions';
import { GOVERNANCE_PROGRAM_SEED } from './accounts';

export const withRelinquishVote = async (
  instructions: TransactionInstruction[],
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  governingTokenMint: PublicKey,
  vote: Vote,
  payer: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new RelinquishVoteArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const [voteRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      tokenOwnerRecord.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  const keys = [
    {
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposal,
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
      pubkey: PROGRAM_IDS.system,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: PROGRAM_IDS.governance.programId,
      data,
    }),
  );
};
