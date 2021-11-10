import { Connection, PublicKey } from '@solana/web3.js';
import { getProgramDataAccount } from '../../tools/sdk/bpfUpgradeableLoader/accounts';

export const PROGRAM_VERSION_V1 = 1;
export const PROGRAM_VERSION_V2 = 2;

// The most up to date program version
export const PROGRAM_VERSION = PROGRAM_VERSION_V2;

export async function getProgramVersion(
  connection: Connection,
  programId: string,
  env: string,
) {
  // For localnet always use the latest version
  if (env === 'localnet') {
    return PROGRAM_VERSION;
  }

  const programData = await getProgramDataAccount(
    connection,
    new PublicKey(programId),
  );

  const slot = getLatestVersionCutOffSlot(env);

  return programData.slot > slot ? PROGRAM_VERSION : PROGRAM_VERSION_V1;
}

// Returns the min deployment slot from which onwards the program should be on the latest version
function getLatestVersionCutOffSlot(env: string) {
  switch (env) {
    case 'devnet':
      return 93177719;
    default:
      // Default to mainnet slot
      return 106098492;
  }
}
