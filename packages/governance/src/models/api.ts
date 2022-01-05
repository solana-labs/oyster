import {
  Account,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import { ParsedAccount, simulateTransaction } from '@oyster/common';
import {
  getGovernanceSchemaForAccount,
  GovernanceAccountParser,
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
} from './core/api';
import { PROGRAM_VERSION_V1 } from './registry/api';
import { parseVersion } from '../tools/version';
import { getProgramDataAccount } from '../tools/sdk/bpfUpgradeableLoader/accounts';
import { BN } from 'bn.js';
import { withUpdateProgramMetadata } from './withUpdateProgramMetadata';

export async function getRealms(endpoint: string, programId: PublicKey) {
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
  ) as ParsedAccount<TokenOwnerRecord>;

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
    ParsedAccount<TAccount>
  >;
}

export async function getGovernanceProgramVersion(
  connection: Connection,
  programId: PublicKey,
) {
  // Try get program metadata
  const programMetadataPk = await getProgramMetadataAddress(programId);

  try {
    const programMetadataInfo = await connection.getAccountInfo(
      programMetadataPk,
    );

    // If ProgramMetadata exists then fetch to get latest updated version
    if (programMetadataInfo) {
      const programMetadata = GovernanceAccountParser(ProgramMetadata)(
        programMetadataPk,
        programMetadataInfo,
      ) as ParsedAccount<ProgramMetadata>;

      const programData = await getProgramDataAccount(
        connection,
        new PublicKey(programId),
      );

      // Check if ProgramMetadata is not stale
      if (programMetadata.info.updatedAt.gte(new BN(programData.slot))) {
        const version = parseVersion(programMetadata.info.version);
        return version.major;
      }
    }
  } catch {
    // nop
  }

  // If we don't have the programMetadata info then simulate UpdateProgramMetadata
  let instructions: TransactionInstruction[] = [];
  let signer = new Account();
  await withUpdateProgramMetadata(instructions, programId, signer.publicKey);

  const transaction = new Transaction({ feePayer: signer.publicKey });
  transaction.add(...instructions);

  const getVersion = await simulateTransaction(
    connection,
    transaction,
    'recent',
  );

  if (!getVersion.value.err) {
    // TODO: read details
  }

  return PROGRAM_VERSION_V1;
}
