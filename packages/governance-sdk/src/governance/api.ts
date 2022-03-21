import { Connection, PublicKey } from '@solana/web3.js';

import {
  getGovernanceSchemaForAccount,
  GovernanceAccountParser,
} from './serialisation';
import {
  getAccountTypes,
  getTokenOwnerRecordAddress,
  Governance,
  GovernanceAccount,
  GovernanceAccountClass,
  Proposal,
  Realm,
  TokenOwnerRecord,
  VoteRecord,
  RealmConfigAccount,
  getRealmConfigAddress,
} from './accounts';

import {
  getBorshProgramAccounts,
  MemcmpFilter,
  pubkeyFilter,
} from '../core/api';

import { ProgramAccount } from '../tools/sdk/runtime';

// Realms

export async function getRealm(connection: Connection, realm: PublicKey) {
  return getGovernanceAccount(connection, realm, Realm);
}

export async function getRealms(connection: Connection, programId: PublicKey) {
  return getGovernanceAccounts(connection, programId, Realm);
}

// Realm config
export async function tryGetRealmConfig(
  connection: Connection,
  programId: PublicKey,
  realmPk: PublicKey,
) {
  const realmConfigPk = await getRealmConfigAddress(programId, realmPk);
  return getGovernanceAccount(connection, realmConfigPk, RealmConfigAccount);
}

// VoteRecords

export async function getVoteRecordsByVoter(
  connection: Connection,
  programId: PublicKey,
  voter: PublicKey,
) {
  return getGovernanceAccounts(connection, programId, VoteRecord, [
    pubkeyFilter(33, voter)!,
  ]);
}

// TokenOwnerRecords

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

  return getGovernanceAccount(connection, tokenOwnerRecordPk, TokenOwnerRecord);
}

export async function getTokenOwnerRecord(
  connection: Connection,
  tokenOwnerRecordPk: PublicKey,
) {
  return getGovernanceAccount(connection, tokenOwnerRecordPk, TokenOwnerRecord);
}

/**
 * Returns TokenOwnerRecords for the given token owner (voter)
 * Note: The function returns TokenOwnerRecords for both council and community token holders
 *
 * @param connection
 * @param programId
 * @param governingTokenOwner
 * @returns
 */
export async function getTokenOwnerRecordsByOwner(
  connection: Connection,
  programId: PublicKey,
  governingTokenOwner: PublicKey,
) {
  return getGovernanceAccounts(connection, programId, TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, governingTokenOwner)!,
  ]);
}

/**
 * Returns all TokenOwnerRecords for all members for the given Realm
 * Note: The function returns TokenOwnerRecords for both council and community token holders
 *
 * @param connection
 * @param programId
 * @param realmPk
 * @returns
 */
export async function getAllTokenOwnerRecords(
  connection: Connection,
  programId: PublicKey,
  realmPk: PublicKey,
) {
  return getGovernanceAccounts(connection, programId, TokenOwnerRecord, [
    pubkeyFilter(1, realmPk)!,
  ]);
}

// Governances

export async function getGovernance(
  connection: Connection,
  governance: PublicKey,
) {
  return getGovernanceAccount(connection, governance, Governance);
}

/**
 * Returns all governances for the given program instance and realm
 *
 * @param connection
 * @param programId
 * @param realmPk
 * @returns
 */
export async function getAllGovernances(
  connection: Connection,
  programId: PublicKey,
  realmPk: PublicKey,
) {
  return getGovernanceAccounts(connection, programId, Governance, [
    pubkeyFilter(1, realmPk)!,
  ]);
}

// Proposal

export async function getProposal(connection: Connection, proposal: PublicKey) {
  return getGovernanceAccount(connection, proposal, Proposal);
}

/**
 * Returns all Proposals for the given Governance
 *
 * @param connection
 * @param programId
 * @param governancePk
 * @returns
 */
export async function getProposalsByGovernance(
  connection: Connection,
  programId: PublicKey,
  governancePk: PublicKey,
) {
  return getGovernanceAccounts(connection, programId, Proposal, [
    pubkeyFilter(1, governancePk)!,
  ]);
}

/**
 * Returns all Proposals for the given Realm
 *
 * @param connection
 * @param programId
 * @param realmPk
 * @returns
 */
export async function getAllProposals(
  connection: Connection,
  programId: PublicKey,
  realmPk: PublicKey,
) {
  return getAllGovernances(connection, programId, realmPk).then(gs =>
    Promise.all(
      gs.map(g => getProposalsByGovernance(connection, programId, g.pubkey)),
    ),
  );
}

// Generic API

export async function getGovernanceAccounts<TAccount extends GovernanceAccount>(
  connection: Connection,
  programId: PublicKey,
  accountClass: new (args: any) => TAccount,
  filters: MemcmpFilter[] = [],
) {
  const accountTypes = getAccountTypes(
    (accountClass as any) as GovernanceAccountClass,
  );

  let all: ProgramAccount<TAccount>[] = [];

  for (const accountType of accountTypes) {
    let accounts = await getBorshProgramAccounts(
      connection,
      programId,
      at => getGovernanceSchemaForAccount(at),
      accountClass,
      filters,
      accountType,
    );

    all.push(...accounts);
  }

  return all;
}

export async function getGovernanceAccount<TAccount extends GovernanceAccount>(
  connection: Connection,
  accountPk: PublicKey,
  accountClass: new (args: any) => TAccount,
) {
  const accountInfo = await connection.getAccountInfo(accountPk);

  if (!accountInfo) {
    throw new Error(
      `Account ${accountPk} of type ${accountClass.name} not found`,
    );
  }

  return GovernanceAccountParser(accountClass as any)(
    accountPk,
    accountInfo,
  ) as ProgramAccount<TAccount>;
}

export async function tryGetGovernanceAccount<
  TAccount extends GovernanceAccount
>(
  connection: Connection,
  accountPk: PublicKey,
  accountClass: new (args: any) => TAccount | undefined,
) {
  const accountInfo = await connection.getAccountInfo(accountPk);

  if (accountInfo) {
    return GovernanceAccountParser(accountClass as any)(
      accountPk,
      accountInfo,
    ) as ProgramAccount<TAccount>;
  }
}
