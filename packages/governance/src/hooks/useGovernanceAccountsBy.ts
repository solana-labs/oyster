import {
  utils,
  ParsedAccount,
  useConnectionConfig,
  useConnection,
} from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import {
  GovernanceAccountClass,
  GovernanceAccountType,
} from '../models/accounts';
import { BorshAccountParser } from '../models/serialisation';

// Fetches Governance program accounts of the given type and subscribes to updates
export function useGovernanceAccountsBy<TAccount, TGetBy>(
  getBy: TGetBy | undefined,
  getAccountsBy: (
    endpoint: string,
    getBy: TGetBy,
  ) => Promise<Record<string, ParsedAccount<TAccount>>>,
  accountClass: GovernanceAccountClass,
  accountTypes: GovernanceAccountType[],
) {
  const [accounts, setAccounts] = useState<
    Record<string, ParsedAccount<TAccount>>
  >({});

  const { endpoint } = useConnectionConfig();
  const connection = useConnection();

  const getByKey = getBy instanceof PublicKey ? getBy.toBase58() : getBy;

  useEffect(() => {
    if (!getBy) {
      return;
    }

    const sub = (async () => {
      const loadedAccounts = await getAccountsBy(endpoint, getBy);
      setAccounts(loadedAccounts);

      const { governance } = utils.programIds();

      return connection.onProgramAccountChange(governance.programId, info => {
        if (accountTypes.some(at => info.accountInfo.data[0] === at)) {
          const account = BorshAccountParser(accountClass)(
            info.accountId,
            info.accountInfo,
          ) as ParsedAccount<TAccount>;

          setAccounts((acts: any) => ({
            ...acts,
            [info.accountId.toBase58()]: account,
          }));
        }
      });
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getByKey, connection, endpoint]);

  return Object.values(accounts);
}
