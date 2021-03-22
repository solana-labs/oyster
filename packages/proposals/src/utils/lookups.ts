import { Account, PublicKey } from '@solana/web3.js';
import { contexts, utils } from '@oyster/common';
import { AccountLayout } from '@solana/spl-token';
import * as bs58 from 'bs58';

const { deserializeAccount } = contexts.Accounts;

export async function getVoteAccountHolders(
  mint?: PublicKey,
  endpoint?: string,
): Promise<Record<string, Account>> {
  const PROGRAM_IDS = utils.programIds();
  if (!mint || !endpoint) return {};

  const [authority] = await PublicKey.findProgramAddress(
    [PROGRAM_IDS.timelock.programAccountId.toBuffer()],
    PROGRAM_IDS.timelock.programId,
  );

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
  const authorityBase58 = authority.toBase58();
  for (let acc of raw) {
    const account = deserializeAccount(bs58.decode(acc.account.data));
    if (account.owner.toBase58() !== authorityBase58)
      accounts[acc.pubkey] = account;
  }

  return accounts;
}
