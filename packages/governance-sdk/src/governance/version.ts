import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_VERSION, PROGRAM_VERSION_V1 } from '../registry/constants';
import { BN_ZERO } from '../tools/numbers';
import { getProgramDataAccount } from '../tools/sdk/bpfUpgradeableLoader';
import { ProgramAccount, simulateTransaction } from '../tools/sdk/runtime';
import { parseVersion } from '../tools/version';
import { getProgramMetadataAddress, ProgramMetadata } from './accounts';
import { GovernanceAccountParser } from './serialisation';
import { withUpdateProgramMetadata } from './withUpdateProgramMetadata';

export async function getGovernanceProgramVersion(
  connection: Connection,
  programId: PublicKey,
  env?: string,
) {
  // Try get program metadata
  const programMetadataPk = await getProgramMetadataAddress(programId);

  try {
    const programMetadataInfo = await connection.getAccountInfo(
      programMetadataPk,
    );

    // If ProgramMetadata exists then use it to get latest updated version
    if (programMetadataInfo) {
      const programMetadata = GovernanceAccountParser(ProgramMetadata)(
        programMetadataPk,
        programMetadataInfo,
      ) as ProgramAccount<ProgramMetadata>;

      let deploySlot = BN_ZERO;

      try {
        const programData = await getProgramDataAccount(
          connection,
          new PublicKey(programId),
        );
        deploySlot = new BN(programData.slot);
      } catch {
        // If the program is not upgradable for example on localnet then there is no ProgramData account
        // and Metadata must be more recent
      }

      // Check if ProgramMetadata is not stale
      if (programMetadata.account.updatedAt.gte(deploySlot)) {
        const version = parseVersion(programMetadata.account.version);
        console.log('Program version (metadata)', version);
        return version.major;
      }
    }
  } catch {
    // nop, let's try simulation
  }

  try {
    // If we don't have the programMetadata info then simulate UpdateProgramMetadata
    let instructions: TransactionInstruction[] = [];
    // The wallet can be any existing account for the simulation
    // Note: when running a local validator ensure the account is copied from devnet: --clone ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk -ud
    let walletPk = new PublicKey(
      'ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk',
    );

    await withUpdateProgramMetadata(instructions, programId, walletPk);

    const transaction = new Transaction({ feePayer: walletPk });
    transaction.add(...instructions);

    // TODO: Once return values are supported change the simulation call to the actual one
    const getVersion = await simulateTransaction(
      connection,
      transaction,
      'recent',
    );

    if (getVersion.value.logs) {
      const prefix = 'PROGRAM-VERSION:"';

      const simVersion = getVersion.value.logs
        .filter(l => l.includes(prefix))
        .map(l => {
          const versionStart = l.indexOf(prefix);

          return parseVersion(
            l.substring(versionStart + prefix.length, l.length - 1),
          );
        })[0];

      console.debug('Program version (simulation)', simVersion);

      return simVersion.major;
    }
  } catch (ex) {
    console.log("Can't determine program version", ex);
  }

  // If we can't determine the version using the program instance and running localnet then use the latest version
  if (env === 'localnet') {
    return PROGRAM_VERSION;
  }

  // Default to V1 because it's not possible to detect its version
  return PROGRAM_VERSION_V1;
}
