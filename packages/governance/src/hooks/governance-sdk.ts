import { Connection, PublicKey } from '@solana/web3.js';
import {
  GovernanceAddinAccountParser,
  MaxVoterWeightRecord,
  ProgramAccount,
  Realm,
  VoterWeightRecord,
} from '@solana/spl-governance';
import bs58 from 'bs58';

export type AccountVoterWeightRecord = {
  voterWeight: ProgramAccount<VoterWeightRecord>;
  maxVoterWeight: ProgramAccount<MaxVoterWeightRecord>;
};

export async function getVoterWeightProgramAccount(
  realm: ProgramAccount<Realm>,
  connection: Connection,
  programId: PublicKey,
  walletPublicKey: PublicKey,
) {
  const discriminatorVoterWeightRecord = [50, 101, 102, 57, 57, 98, 52, 98];
  const voterWeightBytes = discriminatorVoterWeightRecord
    .concat(...realm.pubkey.toBytes())
    .concat(...realm.account.communityMint.toBytes())
    .concat(...walletPublicKey.toBytes());

  const discriminatorMaxVoterWeightRecord = [57, 100, 53, 102, 102, 50, 57, 55];
  const maxVoterWeightBytes = discriminatorMaxVoterWeightRecord
    .concat(...realm.pubkey.toBytes())
    .concat(...realm.account.communityMint.toBytes());

  const [voterWeight] = await connection.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: bs58.encode(voterWeightBytes),
        },
      },
    ],
  });

  const [maxVoterWeight] = await connection.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: bs58.encode(maxVoterWeightBytes),
        },
      },
    ],
  });

  if (!voterWeight || !maxVoterWeight) return;

  return {
    voterWeight: GovernanceAddinAccountParser(VoterWeightRecord)(
      voterWeight.pubkey,
      voterWeight.account,
    ),
    maxVoterWeight: GovernanceAddinAccountParser(MaxVoterWeightRecord)(
      maxVoterWeight.pubkey,
      maxVoterWeight.account,
    ),
  };
}
