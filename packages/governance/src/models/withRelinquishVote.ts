import { utils } from '@oyster/common';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GOVERNANCE_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { RelinquishVoteArgs } from './instructions';

export const withRelinquishVote = async (
  instructions: TransactionInstruction[],
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governingTokenMint: PublicKey,
  voteRecord: PublicKey,
) => {
  const PROGRAM_IDS = utils.programIds();

  const args = new RelinquishVoteArgs();
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

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
      pubkey: voteRecord,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governingTokenMint,
      isWritable: false,
      isSigner: false,
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
