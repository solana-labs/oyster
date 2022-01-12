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

export async function getRealms(rpcEndpoint: string, programId: PublicKey) {
  return getGovernanceAccounts(rpcEndpoint, programId, Realm);
}

// VoteRecords

export async function getVoteRecordsByVoter(
  rpcEndpoint: string,
  programId: PublicKey,
  voter: PublicKey,
) {
  return getGovernanceAccounts(rpcEndpoint, programId, VoteRecord, [
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

// Governances

export async function getGovernance(
  connection: Connection,
  governance: PublicKey,
) {
  return getGovernanceAccount(connection, governance, Governance);
}

// Proposal

export async function getProposal(
  connection: Connection,
  proposalPk: PublicKey,
) {
  return getGovernanceAccount(connection, proposalPk, Proposal);
}

// Generic API

export async function getGovernanceAccounts<TAccount extends GovernanceAccount>(
  rpcEndpoint: string,
  programId: PublicKey,
  accountClass: new (args: any) => TAccount,
  filters: MemcmpFilter[] = [],
) {
  const accountTypes = getAccountTypes(
    (accountClass as any) as GovernanceAccountClass,
  );

  if (accountTypes.length === 1) {
    return getBorshProgramAccounts(
      rpcEndpoint,
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
        rpcEndpoint,
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
