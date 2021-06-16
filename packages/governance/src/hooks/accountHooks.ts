import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

import { getAccountTypes, GovernanceAccountClass } from '../models/accounts';
import { BorshAccountParser } from '../models/serialisation';

import {
  utils,
  ParsedAccount,
  useConnectionConfig,
  useConnection,
} from '@oyster/common';
import { MemcmpFilter, getGovernanceAccounts } from '../utils/api';

// Fetches Governance program account using the given key and subscribes to updates
export function useGovernanceAccountByPubkey<TAccount>(
  accountClass: GovernanceAccountClass,
  pubkey: PublicKey | undefined,
) {
  const [account, setAccount] = useState<ParsedAccount<TAccount>>();

  const { endpoint } = useConnectionConfig();
  const connection = useConnection();

  const getByPubkey = pubkey?.toBase58();

  useEffect(() => {
    if (!pubkey) {
      return;
    }

    const sub = (async () => {
      // TODO: Add retries

      const accountInfo = await connection.getAccountInfo(pubkey);
      const loadedAccount = BorshAccountParser(accountClass)(
        pubkey,
        accountInfo!,
      );
      setAccount(loadedAccount);

      const { governance } = utils.programIds();
      const accountTypes = getAccountTypes(accountClass);

      return connection.onProgramAccountChange(governance.programId, info => {
        if (
          info.accountId.toBase58() === getByPubkey &&
          accountTypes.some(at => info.accountInfo.data[0] === at)
        ) {
          const account = BorshAccountParser(accountClass)(
            info.accountId,
            info.accountInfo,
          ) as ParsedAccount<TAccount>;

          setAccount(account);
        }
      });
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getByPubkey, connection, endpoint]);

  return account;
}

// Fetches Governance program account using the given PDA args and subscribes to updates
export function useGovernanceAccountByPda<TAccount>(
  accountClass: GovernanceAccountClass,
  getPda: () => Promise<PublicKey | undefined>,
  pdaArgs: any[],
) {
  const [pda, setPda] = useState<PublicKey | undefined>();

  const pdaArgsKey = JSON.stringify(pdaArgs);

  useEffect(() => {
    (async () => {
      const resolvedPda = await getPda();
      setPda(resolvedPda);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdaArgsKey]);

  return useGovernanceAccountByPubkey<TAccount>(accountClass, pda);
}

// Fetches Governance program accounts using the given filter and subscribes to updates
export function useGovernanceAccountsByFilter<TAccount>(
  accountClass: GovernanceAccountClass,
  filters: (MemcmpFilter | undefined)[],
) {
  const [accounts, setAccounts] = useState<
    Record<string, ParsedAccount<TAccount>>
  >({});

  const { endpoint } = useConnectionConfig();
  const connection = useConnection();

  // Use stringify to get stable dependency for useEffect to  ensure we load the initial snapshot of accounts only once
  // If it causes performance issues then we should use object compare logic https://stackoverflow.com/questions/53601931/custom-useeffect-second-argument
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    if (filters.some(f => !f)) {
      return;
    }

    const queryFilters = filters.map(f => f!);
    const accountTypes = getAccountTypes(accountClass);

    const sub = (async () => {
      // TODO: add retries
      const loadedAccounts = await getGovernanceAccounts<TAccount>(
        endpoint,
        accountClass,
        accountTypes,
        queryFilters,
      );
      setAccounts(loadedAccounts);

      const { governance } = utils.programIds();

      return connection.onProgramAccountChange(governance.programId, info => {
        if (accountTypes.some(at => info.accountInfo.data[0] === at)) {
          const isMatch = !queryFilters.some(
            f => !f.isMatch(info.accountInfo.data),
          );
          const base58Key = info.accountId.toBase58();

          const account = BorshAccountParser(accountClass)(
            info.accountId,
            info.accountInfo,
          ) as ParsedAccount<TAccount>;

          setAccounts((acts: any) => {
            if (isMatch) {
              return {
                ...acts,
                [base58Key]: account,
              };
            } else if (acts[base58Key]) {
              return {
                ...Object.keys(acts)
                  .filter(k => k !== base58Key)
                  .reduce((res, key) => {
                    res[key] = acts[key];
                    return res;
                  }, {} as any),
              };
            } else {
              return acts;
            }
          });
        }
      });
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, connection, endpoint]);

  return Object.values(accounts);
}
