import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { deserializeBorsh, ParsedAccount, utils } from '@oyster/common';
import {
  GovernanceVotingRecord,
  GovernanceVotingRecordLayout,
  GovernanceVotingRecordParser,
  GOVERNANCE_SCHEMA,
} from '../models/serialisation';
import { Governance, GovernanceAccountType, Realm } from '../models/accounts';

const MAX_LOOKUPS = 5000;
export async function getGovernanceVotingRecords(
  proposal?: PublicKey,
  endpoint?: string,
): Promise<Record<string, ParsedAccount<GovernanceVotingRecord>>> {
  const PROGRAM_IDS = utils.programIds();
  if (!proposal || !endpoint) return {};

  let accountRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getProgramAccounts',
      params: [
        PROGRAM_IDS.governance.programId.toBase58(),
        {
          commitment: 'single',
          filters: [
            { dataSize: GovernanceVotingRecordLayout.span },
            {
              memcmp: {
                // Proposal key is second thing in the account data
                offset: 1,
                bytes: proposal.toString(),
              },
            },
          ],
        },
      ],
    }),
  });
  let raw = (await accountRes.json())['result'];
  if (!raw) return {};
  let accounts: Record<string, ParsedAccount<GovernanceVotingRecord>> = {};
  let i = 0;
  for (let acc of raw) {
    const account = GovernanceVotingRecordParser(acc.pubkey, {
      ...acc.account,
      data: bs58.decode(acc.account.data),
    }) as ParsedAccount<GovernanceVotingRecord>;
    if (i > MAX_LOOKUPS) break;
    accounts[account.info.owner.toBase58()] = account;
    i++;
  }

  return accounts;
}

export async function getRealms(endpoint: string) {
  return getGovernanceAccounts<Realm>(
    endpoint,
    Realm,
    GovernanceAccountType.Realm,
  );
}

export async function getGovernances(endpoint: string) {
  const accountGovernances = getGovernanceAccounts<Governance>(
    endpoint,
    Governance,
    GovernanceAccountType.AccountGovernance,
  );
  const programGovernances = getGovernanceAccounts<Governance>(
    endpoint,
    Governance,
    GovernanceAccountType.ProgramGovernance,
  );

  const all = await Promise.all([accountGovernances, programGovernances]);

  return { ...all[0], ...all[1] } as Record<string, ParsedAccount<Governance>>;
}

export async function getGovernanceAccounts<TAccount>(
  endpoint: string,
  classType: any,
  accountType: GovernanceAccountType,
) {
  const PROGRAM_IDS = utils.programIds();
  PROGRAM_IDS.governance.programId.toBase58();

  let getProgramAccounts = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getProgramAccounts',
      params: [
        PROGRAM_IDS.governance.programId.toBase58(),
        {
          commitment: 'single',
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: bs58.encode([accountType]),
              },
            },
          ],

          // {
          //   memcmp: {
          //     offset: 0,
          //     bytes: bs58.encode([accountType]),
          //   },
          // },
          // {
          //   memcmp: {
          //     offset: 1,
          //     bytes: new PublicKey(
          //       'FamZrk6843udYEUMWbkrhttBEDUDyu63sSBUKJbZmHL9',
          //     ).toBase58(),
          //   },
          // },
          //],
        },
      ],
    }),
  });
  const rawAccounts = (await getProgramAccounts.json())['result'];
  let accounts: Record<string, ParsedAccount<TAccount>> = {};

  for (let rawAccount of rawAccounts) {
    const account = {
      pubkey: new PublicKey(rawAccount.pubkey),
      account: {
        ...rawAccount.account,
        data: [], // There is no need to keep the raw data around once we deserialize it into TAccount
      },
      info: deserializeBorsh(
        GOVERNANCE_SCHEMA,
        classType,
        bs58.decode(rawAccount.account.data),
      ),
    };

    accounts[account.pubkey.toBase58()] = account;
  }

  return accounts;
}
