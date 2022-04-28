import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export type GovernanceAddinAccountClass =
  | typeof VoterWeightRecord
  | typeof MaxVoterWeightRecord;

export enum VoterWeightAction {
  CastVote,
  CommentProposal,
  CreateGovernance,
  CreateProposal,
  SignOffProposal,
}

export class VoterWeightRecord {
  accountDiscriminator = new Uint8Array([50, 101, 102, 57, 57, 98, 52, 98]);

  realm: PublicKey;

  governingTokenMint: PublicKey;

  governingTokenOwner: PublicKey;

  voterWeight: BN;

  voterWeightExpiry: BN;

  weightAction: VoterWeightAction | undefined;

  weightActionTarget: PublicKey | undefined;

  constructor(args: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    governingTokenOwner: PublicKey;
    voterWeight: BN;
    voterWeightExpiry: BN;
    weightAction: VoterWeightAction | undefined;
    weightActionTarget: PublicKey | undefined;
  }) {
    this.realm = args.realm;
    this.governingTokenMint = args.governingTokenMint;
    this.governingTokenOwner = args.governingTokenOwner;
    this.voterWeight = args.voterWeight;
    this.voterWeightExpiry = args.voterWeightExpiry;
    this.weightAction = args.weightAction;
    this.weightActionTarget = args.weightActionTarget;
  }
}

/**
 * Returns the default address for VoterWeightRecord
 * Note: individual addins are not required to use the default address and it can vary between different implementations
 **/
export async function getVoterWeightRecordAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) {
  const [voterWeightRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('voter-weight-record'),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    programId,
  );

  return voterWeightRecordAddress;
}

export class MaxVoterWeightRecord {
  accountDiscriminator = new Uint8Array([57, 100, 53, 102, 102, 50, 57, 55]);

  realm: PublicKey;

  governingTokenMint: PublicKey;

  maxVoterWeight: BN;

  maxVoterWeightExpiry: BN;

  constructor(args: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    maxVoterWeight: BN;
    maxVoterWeightExpiry: BN;
  }) {
    this.realm = args.realm;
    this.governingTokenMint = args.governingTokenMint;
    this.maxVoterWeight = args.maxVoterWeight;
    this.maxVoterWeightExpiry = args.maxVoterWeightExpiry;
  }
}

/**
 * Returns the default address for MaxVoterWeightRecord
 * Note: individual addins are not required to use the default address and it can vary between different implementations
 **/
export async function getMaxVoterWeightRecordAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
) {
  const [maxVoterWeightRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('max-voter-weight-record'),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    programId,
  );

  return maxVoterWeightRecordAddress;
}
