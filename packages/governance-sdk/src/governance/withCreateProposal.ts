import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getGovernanceSchema } from './serialisation';
import { serialize } from 'borsh';
import { CreateProposalArgs } from './instructions';
import { GOVERNANCE_PROGRAM_SEED, VoteType } from './accounts';
import { withRealmConfigAccounts } from './withRealmConfigAccounts';
import { PROGRAM_VERSION_V1 } from '../registry';
import { SYSTEM_PROGRAM_ID } from '../tools';

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

  const proposalIndexBuffer = Buffer.alloc(4);
  proposalIndexBuffer.writeInt32LE(proposalIndex, 0);

  const seeds = [
    Buffer.from(GOVERNANCE_PROGRAM_SEED),
    governance.toBuffer(),
    governingTokenMint.toBuffer(),
    proposalIndexBuffer,
  ];
  const [proposalAddress] = await PublicKey.findProgramAddress(
    seeds,
    programId,
  );

  console.log('proposalAddress', proposalAddress.toBase58());

  const programKey =
    programVersion > PROGRAM_VERSION_V1
      ? [{ pubkey: governingTokenMint, isWritable: false, isSigner: false }]
      : [];

  const keys = [
    { pubkey: realm, isWritable: false, isSigner: false },
    { pubkey: proposalAddress, isWritable: true, isSigner: false },
    { pubkey: governance, isWritable: true, isSigner: false },
    { pubkey: tokenOwnerRecord, isWritable: true, isSigner: false },
    ...programKey,
    { pubkey: governanceAuthority, isWritable: false, isSigner: true },
    { pubkey: payer, isWritable: true, isSigner: true },
    { pubkey: SYSTEM_PROGRAM_ID, isWritable: false, isSigner: false },
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

  console.log('voterWeightRecord', voterWeightRecord?.toBase58());
  console.log('maxVoterWeightRecord', maxVoterWeightRecord?.toBase58());

  console.log(`function: withCreateProposal`);
  console.log(keys.map(key => ({ ...key, pubkey: key.pubkey?.toBase58() })));

  instructions.push(new TransactionInstruction({ programId, keys, data }));
  return proposalAddress;
};
