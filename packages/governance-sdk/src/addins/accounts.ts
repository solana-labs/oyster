import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export type GovernanceAddinAccountClass = typeof MaxVoterWeightRecord;

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
