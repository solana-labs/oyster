import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { MemcmpFilter, pubkeyFilter } from '../core/api';
import {
  ChatMessage,
  GovernanceChatAccount,
  GovernanceChatAccountClass,
  GovernanceChatAccountType,
  governanceChatProgramId,
} from './accounts';
import { deserializeBorsh, ParsedAccount } from '@oyster/common';
import { GOVERNANCE_CHAT_SCHEMA } from './serialisation';

export function getGovernanceChatMessages(
  endpoint: string,
  proposal: PublicKey,
) {
  return getGovernanceChatAccounts<ChatMessage>(
    governanceChatProgramId,
    endpoint,
    ChatMessage,
    GovernanceChatAccountType.ChatMessage,
    [pubkeyFilter(1, proposal) as MemcmpFilter],
  );
}

export async function getGovernanceChatAccounts<
  TAccount extends GovernanceChatAccount
>(
  programId: PublicKey,
  endpoint: string,
  accountClass: GovernanceChatAccountClass,
  accountType: GovernanceChatAccountType,
  filters: MemcmpFilter[] = [],
) {
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
        programId.toBase58(),
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
    try {
      const account = {
        pubkey: new PublicKey(rawAccount.pubkey),
        account: {
          ...rawAccount.account,
          data: [], // There is no need to keep the raw data around once we deserialize it into TAccount
        },
        info: deserializeBorsh(
          GOVERNANCE_CHAT_SCHEMA,
          accountClass,
          Buffer.from(rawAccount.account.data[0], 'base64'),
        ),
      };

      accounts[account.pubkey.toBase58()] = account;
    } catch (ex) {
      console.error(`Can't deserialize ${accountClass}`, ex);
    }
  }

  return accounts;
}
