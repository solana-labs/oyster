import { AccountMeta, PublicKey } from '@solana/web3.js';
import { getRealmConfigAddress } from './accounts';

export async function withVoterWeightAccounts(
  keys: AccountMeta[],
  programId: PublicKey,
  realm: PublicKey,
  voterWeightRecord: PublicKey | undefined,
) {
  if (!voterWeightRecord) {
    return;
  }

  const realmConfigAddress = await getRealmConfigAddress(programId, realm);
  keys.push({
    pubkey: realmConfigAddress,
    isWritable: false,
    isSigner: false,
  });
  keys.push({
    pubkey: voterWeightRecord,
    isWritable: false,
    isSigner: false,
  });
}
