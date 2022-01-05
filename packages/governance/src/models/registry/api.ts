import { Connection, PublicKey } from '@solana/web3.js';

import { getGovernanceProgramVersion } from '../api';

export const PROGRAM_VERSION_V1 = 1;
export const PROGRAM_VERSION_V2 = 2;

// The most up to date program version
export const PROGRAM_VERSION = PROGRAM_VERSION_V2;

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
