import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  getGovernanceSchemaForAccount,
  GovernanceAccountParser,
  GOVERNANCE_SCHEMA,
} from './serialisation';
import {
  getAccountTypes,
  getProgramMetadataAddress,
  getTokenOwnerRecordAddress,
  GovernanceAccount,
  GovernanceAccountClass,
  GovernanceAccountType,
  ProgramMetadata,
  Realm,
  TokenOwnerRecord,
  VoteRecord,
} from './accounts';

import {
  getBorshProgramAccounts,
  MemcmpFilter,
  pubkeyFilter,
} from '../core/api';
import { PROGRAM_VERSION, PROGRAM_VERSION_V1 } from '../registry/api';
import { parseVersion } from '../tools/version';
import { getProgramDataAccount } from '../tools/sdk/bpfUpgradeableLoader/accounts';
import { BN } from 'bn.js';
import { withUpdateProgramMetadata } from './withUpdateProgramMetadata';
import { ProgramAccount, simulateTransaction2 } from '../tools/solanaSdk';
import { BN_ZERO } from '../tools/numbers';
import { BorshAccountParser } from '../core';

export async function getRealms(endpoint: string, programId: PublicKey) {
  console.log('GET REALMS');

  return getBorshProgramAccounts<Realm>(
    programId,
    at => getGovernanceSchemaForAccount(at),
    endpoint,
    Realm,
  );
}

export async function getVoteRecordsByVoter(
  programId: PublicKey,
  endpoint: string,
  voter: PublicKey,
) {
  return getGovernanceAccounts<VoteRecord>(
    programId,
    endpoint,
    VoteRecord,
    getAccountTypes(VoteRecord),
    [pubkeyFilter(33, voter)!],
  );
}

export async function getTokenOwnerRecordForRealm(
  connection: Connection,
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) {
  const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
    programId,
    realm,
    governingTokenMint,
    governingTokenOwner,
  );

  const tokenOwnerRecordInfo = await connection.getAccountInfo(
    tokenOwnerRecordPk,
  );

  if (!tokenOwnerRecordInfo) {
    throw new Error(
      `Can't fetch token owner record at ${tokenOwnerRecordPk.toBase58()}`,
    );
  }

  const tokenOwnerRecord = GovernanceAccountParser(TokenOwnerRecord)(
    tokenOwnerRecordPk,
    tokenOwnerRecordInfo,
  ) as ProgramAccount<TokenOwnerRecord>;

  return tokenOwnerRecord;
}

export async function getGovernanceAccounts<TAccount extends GovernanceAccount>(
  programId: PublicKey,
  endpoint: string,
  accountClass: GovernanceAccountClass,
  accountTypes: GovernanceAccountType[],
  filters: MemcmpFilter[] = [],
) {
  if (accountTypes.length === 1) {
    return getBorshProgramAccounts<TAccount>(
      programId,
      at => getGovernanceSchemaForAccount(at),
      endpoint,
      accountClass as any,
      filters,
      accountTypes[0],
    );
  }

  const all = await Promise.all(
    accountTypes.map(at =>
      getBorshProgramAccounts<TAccount>(
        programId,
        at => getGovernanceSchemaForAccount(at),
        endpoint,
        accountClass as any,
        filters,
        at,
      ),
    ),
  );

  return all.reduce((res, r) => ({ ...res, ...r }), {}) as Record<
    string,
    ProgramAccount<TAccount>
  >;
}

export async function getGovernanceProgramVersion(
  connection: Connection,
  programId: PublicKey,
  env: string,
) {
  // Try get program metadata
  const programMetadataPk = await getProgramMetadataAddress(programId);

  try {
    const programMetadataInfo = await connection.getAccountInfo(
      programMetadataPk,
    );

    // If ProgramMetadata exists then use it to get latest updated version
    if (programMetadataInfo) {
      const programMetadata = BorshAccountParser(
        ProgramMetadata,
        () => GOVERNANCE_SCHEMA,
      )(
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
    const getVersion = await simulateTransaction2(
      connection,
      transaction,
      'recent',
    );

    if (!getVersion.value.err && getVersion.value.logs) {
      const prefix = 'PROGRAM-VERSION:"';

      const simVersion = getVersion.value.logs
        .filter(l => l.includes(prefix))
        .map(l => {
          const versionStart = l.indexOf(prefix);

          return parseVersion(
            l.substring(versionStart + prefix.length, l.length - 1),
          );
        })[0];

      console.log('Program version (simulation)', simVersion);

      return simVersion.major;
    }
  } catch (ex) {
    console.log("Can't determine program version", ex);
  }

  // If we can't determine the version using the program instance and running localnet then use the latest version
  if (env === 'localnet') {
    return PROGRAM_VERSION;
  }

  return PROGRAM_VERSION_V1;
}
