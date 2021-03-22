import { Account, PublicKey } from '@solana/web3.js';
import { contexts, utils } from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import * as bs58 from 'bs58';

const { deserializeAccount } = contexts.Accounts;

export async function getVoteAccountHolders(
  proposalKey: PublicKey,
  mint: PublicKey,
  endpoint: string,
): Promise<Record<string, Account>> {
  const PROGRAM_IDS = utils.programIds();
  if (!mint) return {};

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
        PROGRAM_IDS.token.toBase58(),
        {
          commitment: 'single',
          filters: [
            { dataSize: AccountLayout.span },
            {
              memcmp: {
                // Mint is first thing in the account data
                offset: 0,
                bytes: mint.toString(),
              },
            },
          ],
        },
      ],
    }),
  });
  let raw = (await accountRes.json())['result'];
  if (!raw) return {};
  let accounts: Record<string, Account> = {};
  /* for (let acc of raw) {
    const account: Account = deserializeAccount(bs58.decode(acc.account.data));
    if account
    accounts[acc.pubkey] = ;
  }*/

  return accounts;
}
