import React, { useContext, useEffect, useState } from 'react';

import {
  Connection,
  KeyedAccountInfo,
  PublicKey,
  PublicKeyAndAccount,
} from '@solana/web3.js';
import { useMemo } from 'react';

import {
  utils,
  ParsedAccount,
  useConnectionConfig,
  cache,
} from '@oyster/common';
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

  useSetupGovernanceContext({
    connection,
    endpoint,
    setRealms,
  });

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

function useSetupGovernanceContext({
  connection,
  endpoint,
  setRealms,
}: {
  connection: Connection;
  endpoint: string;

  setRealms: React.Dispatch<React.SetStateAction<{}>>;
}) {
  useEffect(() => {
    const PROGRAM_IDS = utils.programIds();

    const query = async () => {
      const programAccounts = await connection.getProgramAccounts(
        PROGRAM_IDS.governance.programId,
      );
      return programAccounts;
    };
    Promise.all([query()]).then((all: PublicKeyAndAccount<Buffer>[][]) => {
      getRealms(endpoint).then(realms => setRealms(realms));
    });

    const subID = connection.onProgramAccountChange(
      PROGRAM_IDS.governance.programId,
      async (info: KeyedAccountInfo) => {
        const pubkey =
          typeof info.accountId === 'string'
            ? new PublicKey(info.accountId as unknown as string)
            : info.accountId;

        switch (info.accountInfo.data[0]) {
          case GovernanceAccountType.Realm:
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(Realm),
            );
            setRealms((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<Realm>,
            }));
            break;
        }
      },
      'singleGossip',
    );
    return () => {
      connection.removeProgramAccountChangeListener(subID);
    };
  }, [connection]); //eslint-disable-line
}

export const useGovernanceContext = () => {
  const context = useContext(GovernanceContext);
  return context as GovernanceContextState;
};

export const useRealms = () => {
  const ctx = useGovernanceContext();

  return Object.values(ctx.realms);
};

export const useRealm = (realm?: PublicKey) => {
  const ctx = useGovernanceContext();

  return realm && ctx.realms[realm.toBase58()];
};
