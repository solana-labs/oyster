import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { CreateProposalArgs } from './instructions';
import {
  getRealmConfigAddress,
  GOVERNANCE_PROGRAM_SEED,
  VoteType,
} from './accounts';
import { PROGRAM_VERSION_V1 } from '../registry/constants';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { withRealmConfigAccounts } from './withRealmConfigAccounts';

export const withCreateProposal = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  realm: PublicKey,
  governance: PublicKey,
  tokenOwnerRecord: PublicKey,
  name: string,
  descriptionLink: string,
  governingTokenMint: PublicKey,
  governanceAuthority: PublicKey,
  proposalIndex: number,
  voteType: VoteType,
  options: string[],
  useDenyOption: boolean,
  payer: PublicKey,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
) => {
  const args = new CreateProposalArgs({
    name,
    descriptionLink,
    governingTokenMint,
    voteType,
    options,
    useDenyOption,
  });
  const data = Buffer.from(
    serialize(getGovernanceSchema(programVersion), args),
  );

  let proposalIndexBuffer = Buffer.alloc(4);
  proposalIndexBuffer.writeInt32LE(proposalIndex, 0);

  const [proposalAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      governance.toBuffer(),
      governingTokenMint.toBuffer(),
      proposalIndexBuffer,
    ],
    programId,
  );

  let keys = [
    {
      pubkey: realm,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposalAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: true,
      isSigner: false,
    },
    ...(programVersion > PROGRAM_VERSION_V1
      ? [
          {
            pubkey: governingTokenMint,
            isWritable: false,
            isSigner: false,
          },
        ]
      : []),
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (programVersion === PROGRAM_VERSION_V1) {
    keys.push({
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    });
    keys.push({
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isWritable: false,
      isSigner: false,
    });
  }

  await withRealmConfigAccounts(
    keys,
    programId,
    realm,
    voterWeightRecord,
    maxVoterWeightRecord,
  );

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return proposalAddress;
};
