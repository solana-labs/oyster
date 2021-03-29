import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { ParsedAccount, utils } from '@oyster/common';
import {
  GovernanceVotingRecord,
  GovernanceVotingRecordLayout,
  GovernanceVotingRecordParser,
} from '../models/timelock';

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
        PROGRAM_IDS.timelock.programId.toBase58(),
        {
          commitment: 'single',
          filters: [
            { dataSize: GovernanceVotingRecordLayout.span },
            {
              memcmp: {
                // Proposal key is first thing in the account data
                offset: 0,
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
