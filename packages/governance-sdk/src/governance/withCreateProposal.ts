import {
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceInstructionSchema } from './serialisation';
import { serialize } from 'borsh';
import { CreateProposalArgs } from './instructions';
import {
  getProposalDepositAddress,
  getRealmConfigAddress,
  GOVERNANCE_PROGRAM_SEED,
  VoteType,
} from './accounts';
import {
  PROGRAM_VERSION_V1,
  PROGRAM_VERSION_V2,
  PROGRAM_VERSION_V3,
} from '../registry/constants';
import { SYSTEM_PROGRAM_ID } from '../tools/sdk/runtime';
import { withRealmConfigPluginAccounts } from './withRealmConfigPluginAccounts';

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
  // Proposal index is not used from V3
  proposalIndex: number | undefined,
  voteType: VoteType,
  options: string[],
  useDenyOption: boolean,
  payer: PublicKey,
  voterWeightRecord?: PublicKey,
) => {
  const proposalSeed = new Keypair().publicKey;

  const args = new CreateProposalArgs({
    name,
    descriptionLink,
    governingTokenMint,
    voteType,
    options,
    useDenyOption,
    proposalSeed,
  });
  const data = Buffer.from(
    serialize(getGovernanceInstructionSchema(programVersion), args),
  );

  let proposalSeedBuffer = proposalSeed.toBuffer();

  if (programVersion <= PROGRAM_VERSION_V2) {
    if (proposalIndex === undefined) {
      throw new Error(
        `proposalIndex is required for version: ${programVersion}`,
      );
    }
    proposalSeedBuffer = Buffer.alloc(4);
    proposalSeedBuffer.writeInt32LE(proposalIndex, 0);
  }

  const [proposalAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      governance.toBuffer(),
      governingTokenMint.toBuffer(),
      proposalSeedBuffer,
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

  await withRealmConfigPluginAccounts(
    keys,
    programId,
    realm,
    voterWeightRecord,
  );

  if (programVersion >= PROGRAM_VERSION_V3) {
    const proposalDepositAddress = await getProposalDepositAddress(
      programId,
      proposalAddress,
      payer,
    );
    keys.push({
      pubkey: proposalDepositAddress,
      isWritable: true,
      isSigner: false,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return proposalAddress;
};
