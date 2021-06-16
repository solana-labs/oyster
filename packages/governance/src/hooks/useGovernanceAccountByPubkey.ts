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
