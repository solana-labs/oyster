import { Connection, PublicKey } from '@solana/web3.js';
import { getProgramDataAccount } from '../../tools/sdk/bpfUpgradeableLoader/accounts';

// The most up to date program version
export const PROGRAM_VERSION = 2;

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

  return programData.slot > slot ? PROGRAM_VERSION : 1;
}

// Returns the min deployment slot from which onwards the program should be on the latest version
function getLatestVersionCutOffSlot(env: string) {
  switch (env) {
    case 'devnet':
      return 87097690;
    default:
      // Default to mainnet slot
      return 101260833;
  }
}
