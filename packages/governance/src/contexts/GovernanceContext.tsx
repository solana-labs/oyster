import React, { useContext, useEffect, useState } from 'react';

import { Connection, KeyedAccountInfo, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { utils, ParsedAccount, useConnectionConfig } from '@oyster/common';
import { BorshAccountParser } from '../models/serialisation';
import { GovernanceAccountType, Realm } from '../models/accounts';
import { getRealms } from '../utils/api';
import { EventEmitter } from 'eventemitter3';

export interface GovernanceContextState {
  realms: Record<string, ParsedAccount<Realm>>;
  changeTracker: AccountChangeTracker;
}

// const removeCtxItem = (setAction: React.Dispatch<React.SetStateAction<{}>>) => {
//   return (key: string) => {
//     setAction((objs: any) => {
//       return {
//         ...Object.keys(objs)
//           .filter(k => k !== key)
//           .reduce((res, key) => {
//             res[key] = objs[key];
//             return res;
//           }, {} as any),
//       };
//     });
//   };
// };

class AccountRemovedEventArgs {
  pubkey: string;
  accountType: GovernanceAccountType;

  constructor(pubkey: string, accountType: GovernanceAccountType) {
    this.pubkey = pubkey;
    this.accountType = accountType;
  }
}

// Tracks local changes not supported by connection notifications
class AccountChangeTracker {
  private emitter = new EventEmitter();

  onAccountRemoved(callback: (args: AccountRemovedEventArgs) => void) {
    this.emitter.on(AccountRemovedEventArgs.name, callback);
    return () =>
      this.emitter.removeListener(AccountRemovedEventArgs.name, callback);
  }

  notifyAccountRemoved(pubkey: string, accountType: GovernanceAccountType) {
    this.emitter.emit(
      AccountRemovedEventArgs.name,
      new AccountRemovedEventArgs(pubkey, accountType),
    );
  }
}

export const GovernanceContext =
  React.createContext<GovernanceContextState | null>(null);

export default function GovernanceProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();

  const connection = useMemo(
    () => new Connection(endpoint, 'recent'),
    [endpoint],
  );

  const [realms, setRealms] = useState({});

  useEffect(() => {
    const sub = (async () => {
      const realms = await getRealms(endpoint);
      setRealms(realms);

      const PROGRAM_IDS = utils.programIds();

      return connection.onProgramAccountChange(
        PROGRAM_IDS.governance.programId,
        async (info: KeyedAccountInfo) => {
          if (info.accountInfo.data[0] === GovernanceAccountType.Realm) {
            const realm = BorshAccountParser(Realm)(
              info.accountId,
              info.accountInfo,
            );
            setRealms((objs: any) => ({
              ...objs,
              [info.accountId.toBase58()]: realm,
            }));
          }
        },
      );
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
  }, [connection]); //eslint-disable-line

  return (
    <GovernanceContext.Provider
      value={{
        realms,

        changeTracker: new AccountChangeTracker(),
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
}

export function useGovernanceContext() {
  const context = useContext(GovernanceContext);
  return context as GovernanceContextState;
}

export function useAccountChangeTracker() {
  const context = useGovernanceContext();
  return context.changeTracker;
}

export function useRealms() {
  const ctx = useGovernanceContext();
  return Object.values(ctx.realms);
}

export function useRealm(realm: PublicKey | undefined) {
  const ctx = useGovernanceContext();
  return realm && ctx.realms[realm.toBase58()];
}
