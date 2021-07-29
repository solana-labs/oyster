import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

import {
  getAccountTypes,
  GovernanceAccount,
  GovernanceAccountClass,
} from '../models/accounts';
import { BorshAccountParser } from '../models/serialisation';

import { ParsedAccount } from '@oyster/common';
import { MemcmpFilter, getGovernanceAccounts } from '../models/api';
import { useAccountChangeTracker } from '../contexts/GovernanceContext';
import { useRpcContext } from './useRpcContext';

// Fetches Governance program account using the given key and subscribes to updates
export function useGovernanceAccountByPubkey<
  TAccount extends GovernanceAccount
>(accountClass: GovernanceAccountClass, pubkey: PublicKey | undefined) {
  const [account, setAccount] = useState<ParsedAccount<TAccount>>();

  const { connection, endpoint, programId } = useRpcContext();

  const getByPubkey = pubkey?.toBase58();

  useEffect(() => {
    if (!pubkey) {
      return;
    }

    const sub = (async () => {
      // TODO: Add retries for transient errors
      try {
        const accountInfo = await connection.getAccountInfo(pubkey);
        if (accountInfo) {
          const loadedAccount = BorshAccountParser(accountClass)(
            pubkey,
            accountInfo!,
          );
          setAccount(loadedAccount);
        } else {
          setAccount(undefined);
        }
      } catch (ex) {
        console.error(`Can't load ${pubkey.toBase58()} account`, ex);
        setAccount(undefined);
      }

      return connection.onProgramAccountChange(programId, info => {
        if (info.accountId.toBase58() === getByPubkey) {
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
export function useGovernanceAccountByPda<TAccount extends GovernanceAccount>(
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
export function useGovernanceAccountsByFilter<
  TAccount extends GovernanceAccount
>(accountClass: GovernanceAccountClass, filters: (MemcmpFilter | undefined)[]) {
  const [accounts, setAccounts] = useState<
    Record<string, ParsedAccount<TAccount>>
  >({});

  const { connection, endpoint, programId } = useRpcContext();

  const accountChangeTracker = useAccountChangeTracker();

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
      try {
        // TODO: add retries for transient errors
        const loadedAccounts = await getGovernanceAccounts<TAccount>(
          programId,
          endpoint,
          accountClass,
          accountTypes,
          queryFilters,
        );
        setAccounts(loadedAccounts);
      } catch (ex) {
        console.error(`Can't load ${accountClass}`, ex);
        setAccounts({});
      }

      const connSubId = connection.onProgramAccountChange(programId, info => {
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

      const disposeChangeTracker = accountChangeTracker.onAccountRemoved(ar => {
        if (accountTypes.some(at => ar.accountType === at)) {
          setAccounts((acts: any) => {
            if (acts[ar.pubkey]) {
              return {
                ...Object.keys(acts)
                  .filter(k => k !== ar.pubkey)
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

      return { connSubId, disposeChangeTracker };
    })();

    return () => {
      sub.then(({ connSubId, disposeChangeTracker }) => {
        connection.removeProgramAccountChangeListener(connSubId);
        disposeChangeTracker();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, connection, endpoint]);

  return Object.values(accounts);
}

export function useGovernanceAccountByFilter<
  TAccount extends GovernanceAccount
>(accountClass: GovernanceAccountClass, filters: (MemcmpFilter | undefined)[]) {
  const accounts = useGovernanceAccountsByFilter<TAccount>(
    accountClass,
    filters,
  );

  if (accounts.length === 0) {
    return undefined;
  }

  if (accounts.length === 1) {
    return accounts[0];
  }

  throw new Error(
    `Filters ${filters} returned multiple accounts ${accounts} for ${accountClass} while a single result was expected`,
  );
}
