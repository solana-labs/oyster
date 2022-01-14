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

/**
 * Returns TokenOwnerRecords for given token owner 

 * 
 * @param rpcEndpoint 
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

// Governances

export async function getGovernance(
  connection: Connection,
  governance: PublicKey,
) {
  return getGovernanceAccount(connection, governance, Governance);
}

// Proposal

export async function getProposal(connection: Connection, proposal: PublicKey) {
  return getGovernanceAccount(connection, proposal, Proposal);
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

  if (accountTypes.length === 1) {
    return getBorshProgramAccounts(
      connection,
      programId,
      at => getGovernanceSchemaForAccount(at),
      accountClass,
      filters,
      accountTypes[0],
    );
  }

  const all = await Promise.all(
    accountTypes.map(at =>
      getBorshProgramAccounts<TAccount>(
        connection,
        programId,
        at => getGovernanceSchemaForAccount(at),
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
