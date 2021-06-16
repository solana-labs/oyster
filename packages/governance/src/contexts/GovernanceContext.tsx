import React, { useContext, useEffect, useState } from 'react';

import { Connection, KeyedAccountInfo, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { utils, ParsedAccount, useConnectionConfig } from '@oyster/common';
import { BorshAccountParser } from '../models/serialisation';
import { GovernanceAccountType, Realm } from '../models/accounts';
import { getRealms } from '../utils/api';

export interface GovernanceContextState {
  realms: Record<string, ParsedAccount<Realm>>;
  removeInstruction: (key: string) => void;
  removeVoteRecord: (key: string) => void;
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
        removeInstruction: () => {},
        removeVoteRecord: () => {},
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
}

export const useGovernanceContext = () => {
  const context = useContext(GovernanceContext);
  return context as GovernanceContextState;
};

export const useRealms = () => {
  const ctx = useGovernanceContext();

  return Object.values(ctx.realms);
};

export const useRealm = (realm: PublicKey | undefined) => {
  const ctx = useGovernanceContext();

  return realm && ctx.realms[realm.toBase58()];
};
