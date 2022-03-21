import BN from 'bn.js';

export class Realm {
  accountDiscriminator: Uint8Array;

  realm: PublicKey;

  governingTokenMint: PublicKey;

  maxVoterWeight: BN;

  reserved: Uint8Array;

  votingProposalCount: number;

  authority: PublicKey | undefined;

  name: string;

  constructor(args: {
    communityMint: PublicKey;
    reserved: Uint8Array;
    config: RealmConfig;
    votingProposalCount: number;
    authority: PublicKey | undefined;
    name: string;
  }) {
    this.communityMint = args.communityMint;
    this.config = args.config;
    this.reserved = args.reserved;
    this.votingProposalCount = args.votingProposalCount;
    this.authority = args.authority;
    this.name = args.name;
  }
}
