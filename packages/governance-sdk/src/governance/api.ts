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
  ProposalDeposit,
} from './accounts';

import {
  getBorshProgramAccounts,
  MemcmpFilter,
  pubkeyFilter,
} from '../core/api';
import { ProgramAccount } from '../tools/sdk/runtime';
import bs58 from 'bs58';
import axios from 'axios';
import { deserializeBorsh } from '../tools/borsh';
import { getErrorMessage } from '../tools';

export async function getRealm(connection: Connection, realm: PublicKey) {
  return getGovernanceAccount(connection, realm, Realm);
}

export async function getRealms(
  connection: Connection,
  programIds: PublicKey | PublicKey[],
) {
  if (programIds instanceof PublicKey) {
    return getGovernanceAccounts(connection, programIds, Realm);
  }

  return _getRealms(connection, programIds);
}

async function _getRealms(connection: Connection, programIds: PublicKey[]) {
  const accountTypes = getAccountTypes(
    (Realm as any) as GovernanceAccountClass,
  );
  const rpcEndpoint = (connection as any)._rpcEndpoint;

  const rawProgramAccounts = [];

  for (const accountType of accountTypes) {
    const programAccountsJson = await axios.request({
      url: rpcEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify([
        ...programIds.map(x => {
          return {
            jsonrpc: '2.0',
            id: x.toBase58(),
            method: 'getProgramAccounts',
            params: [
              x.toBase58(),
              {
                commitment: connection.commitment,
                encoding: 'base64',
                filters: [
                  {
                    memcmp: {
                      offset: 0,
                      bytes: bs58.encode([accountType]),
                    },
                  },
                ],
              },
            ],
          };
        }),
      ]),
    });

    rawProgramAccounts.push(
      ...programAccountsJson?.data
        ?.filter((x: any) => x.result)
        .flatMap((x: any) => x.result),
    );
  }

  let accounts: ProgramAccount<Realm>[] = [];

  for (let rawAccount of rawProgramAccounts) {
    try {
      const data = Buffer.from(rawAccount.account.data[0], 'base64');
      const accountType = data[0];

      const account: ProgramAccount<Realm> = {
        pubkey: new PublicKey(rawAccount.pubkey),
        account: deserializeBorsh(
          getGovernanceSchemaForAccount(accountType),
          Realm,
          data,
        ),
        owner: rawAccount.account.owner,
      };

      accounts.push(account);
    } catch (ex) {
      console.info(
        `Can't deserialize Realm @ ${rawAccount.pubkey}.`,
        getErrorMessage(ex),
      );
    }
  }
  return accounts;
}

// Realm config
export async function tryGetRealmConfig(
  connection: Connection,
  programId: PublicKey,
  realmPk: PublicKey,
) {
  try {
    const realmConfigPk = await getRealmConfigAddress(programId, realmPk);
    return await getGovernanceAccount(
      connection,
      realmConfigPk,
      RealmConfigAccount,
    );
  } catch {
    // RealmConfigAccount didn't exist in V1 and was optional in V2 and hence it doesn't have to exist
  }
}

export async function getRealmConfig(
  connection: Connection,
  realmConfigPk: PublicKey,
) {
  return getGovernanceAccount(connection, realmConfigPk, RealmConfigAccount);
}

// VoteRecords

export async function getVoteRecord(
  connection: Connection,
  voteRecordPk: PublicKey,
) {
  return getGovernanceAccount(connection, voteRecordPk, VoteRecord);
}

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

// ProposalDeposit api

/**
 * Returns all ProposalDeposits for the given deposit payer
 * @param connection
 * @param programId
 * @param depositPayer
 * @returns
 */
export async function getProposalDepositsByDepositPayer(
  connection: Connection,
  programId: PublicKey,
  depositPayer: PublicKey,
) {
  return getGovernanceAccounts(connection, programId, ProposalDeposit, [
    pubkeyFilter(1 + 32, depositPayer)!,
  ]);
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
