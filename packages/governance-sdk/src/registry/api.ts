import { Connection, PublicKey } from '@solana/web3.js';
import { getGovernanceProgramVersion } from '../governance/api';

export async function getProgramVersion(
  connection: Connection,
  programId: string,
  env: string,
) {
  return await getGovernanceProgramVersion(
    connection,
    new PublicKey(programId),
    env,
  );
}
