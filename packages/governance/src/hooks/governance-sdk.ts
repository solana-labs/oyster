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
  voterWeight?: ProgramAccount<VoterWeightRecord>;
  maxVoterWeight?: ProgramAccount<MaxVoterWeightRecord>;
};

export async function getVoterWeightProgramAccount(
  realm: ProgramAccount<Realm>,
  connection: Connection,
  programId: PublicKey,
  walletPublicKey: PublicKey,
) {
  const discriminatorVoterWeightRecord = [46, 249, 155, 75, 153, 248, 116, 9];
  const voterWeightBytes = discriminatorVoterWeightRecord
    .concat(...realm.pubkey.toBytes())
    .concat(...realm.account.communityMint.toBytes())
    .concat(...walletPublicKey.toBytes());

  const discriminatorMaxVoterWeightRecord = [
    157,
    95,
    242,
    151,
    16,
    98,
    26,
    118,
  ];
  const maxVoterWeightBytes = discriminatorMaxVoterWeightRecord
    .concat(...realm.pubkey.toBytes())
    .concat(...realm.account.communityMint.toBytes());

  let [voterWeight] = await connection.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [{ memcmp: { offset: 0, bytes: bs58.encode(voterWeightBytes) } }],
  });

  let [maxVoterWeight] = await connection.getProgramAccounts(programId, {
    encoding: 'base64',
    filters: [
      { memcmp: { offset: 0, bytes: bs58.encode(maxVoterWeightBytes) } },
    ],
  });

  try {
    return {
      voterWeight: voterWeight
        ? GovernanceAddinAccountParser(VoterWeightRecord)(
            voterWeight.pubkey,
            voterWeight.account,
          )
        : undefined,
      maxVoterWeight: maxVoterWeight
        ? GovernanceAddinAccountParser(MaxVoterWeightRecord)(
            maxVoterWeight.pubkey,
            maxVoterWeight.account,
          )
        : undefined,
    };
  } catch (e) {
    console.log(e);
  }
  return {};
}
