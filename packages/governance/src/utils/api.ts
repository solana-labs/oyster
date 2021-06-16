import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { deserializeBorsh, ParsedAccount, utils } from '@oyster/common';
import { GOVERNANCE_SCHEMA } from '../models/serialisation';
import {
  GovernanceAccountClass,
  GovernanceAccountType,
  Realm,
} from '../models/accounts';

export class MemcmpFilter {
  offset: number;
  bytes: Buffer;

  constructor(offset: number, bytes: Buffer) {
    this.offset = offset;
    this.bytes = bytes;
  }

  isMatch(buffer: Buffer) {
    if (this.offset + this.bytes.length > buffer.length) {
      return false;
    }

    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] !== buffer[this.offset + i]) return false;
    }

    return true;
  }
}

export const pubkeyFilter = (offset: number, pubkey: PublicKey | undefined) =>
  pubkey && new MemcmpFilter(offset, pubkey.toBuffer());

export async function getRealms(endpoint: string) {
  return getGovernanceAccountsImpl<Realm>(
    endpoint,
    Realm,
    GovernanceAccountType.Realm,
  );
}

export async function getGovernanceAccounts<TAccount>(
  endpoint: string,
  accountClass: GovernanceAccountClass,
  accountTypes: GovernanceAccountType[],
  filters: MemcmpFilter[] = [],
) {
  if (accountTypes.length === 1) {
    return getGovernanceAccountsImpl<TAccount>(
      endpoint,
      accountClass,
      accountTypes[0],
      filters,
    );
  }

  const all = await Promise.all(
    accountTypes.map(at =>
      getGovernanceAccountsImpl<TAccount>(endpoint, accountClass, at, filters),
    ),
  );

  return all.reduce((res, r) => ({ ...res, ...r }), {}) as Record<
    string,
    ParsedAccount<TAccount>
  >;
}

async function getGovernanceAccountsImpl<TAccount>(
  endpoint: string,
  accountClass: GovernanceAccountClass,
  accountType: GovernanceAccountType,
  filters: MemcmpFilter[] = [],
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
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: bs58.encode([accountType]),
              },
            },
            ...filters.map(f => ({
              memcmp: { offset: f.offset, bytes: bs58.encode(f.bytes) },
            })),
          ],
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
        accountClass,
        Buffer.from(rawAccount.account.data[0], 'base64'),
      ),
    };

    accounts[account.pubkey.toBase58()] = account;
  }

  return accounts;
}
