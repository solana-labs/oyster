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
  useWallet,
} from '@oyster/common';
import { BorshAccountParser } from '../models/serialisation';
import { GovernanceAccountType, Realm, VoteRecord } from '../models/accounts';
import { getRealms } from '../utils/api';

export interface GovernanceContextState {
  realms: Record<string, ParsedAccount<Realm>>;
  voteRecords: Record<string, ParsedAccount<VoteRecord>>;
  removeInstruction: (key: string) => void;
  removeVoteRecord: (key: string) => void;
}

const removeCtxItem = (setAction: React.Dispatch<React.SetStateAction<{}>>) => {
  return (key: string) => {
    setAction((objs: any) => {
      return {
        ...Object.keys(objs)
          .filter(k => k !== key)
          .reduce((res, key) => {
            res[key] = objs[key];
            return res;
          }, {} as any),
      };
    });
  };
};

export const GovernanceContext =
  React.createContext<GovernanceContextState | null>(null);

export default function GovernanceProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();

  const connection = useMemo(
    () => new Connection(endpoint, 'recent'),
    [endpoint],
  );

  const [realms, setRealms] = useState({});
  const [voteRecords, setVoteRecords] = useState({});

  useSetupGovernanceContext({
    connection,
    endpoint,
    setRealms,
    setVoteRecords,
  });

  return (
    <GovernanceContext.Provider
      value={{
        realms,
        voteRecords,

        removeInstruction: () => {},
        removeVoteRecord: removeCtxItem(setVoteRecords),
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
  setVoteRecords,
}: {
  connection: Connection;
  endpoint: string;

  setRealms: React.Dispatch<React.SetStateAction<{}>>;

  setVoteRecords: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<VoteRecord>>>
  >;
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
      const voteRecords: Record<string, ParsedAccount<VoteRecord>> = {};

      all[0].forEach(a => {
        // TODO: This is done only for MVP to get it working end to end
        // All accounts should not be cached in the context and there is no need to update the global cache either

        switch (a.account.data[0]) {
          case GovernanceAccountType.VoteRecord: {
            const account = BorshAccountParser(VoteRecord)(
              a.pubkey,
              a.account,
            ) as ParsedAccount<VoteRecord>;
            voteRecords[a.pubkey.toBase58()] = account;

            break;
          }
        }
      });

      getRealms(endpoint).then(realms => setRealms(realms));

      setVoteRecords(voteRecords);
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

          case GovernanceAccountType.VoteRecord: {
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(VoteRecord),
            );

            setVoteRecords((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<VoteRecord>,
            }));

            break;
          }
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

export const useWalletVoteRecord = (proposal: PublicKey) => {
  const ctx = useGovernanceContext();
  const { wallet } = useWallet();

  for (let record of Object.values(ctx.voteRecords)) {
    if (
      record.info.governingTokenOwner.toBase58() ===
        wallet?.publicKey?.toBase58() &&
      record.info.proposal.toBase58() === proposal.toBase58()
    ) {
      return record;
    }
  }

  return null;
};

export const useVoteRecords = (proposal: PublicKey | undefined) => {
  const ctx = useGovernanceContext();

  const voteRecords: ParsedAccount<VoteRecord>[] = [];

  if (!ctx.voteRecords) {
    return voteRecords;
  }

  Object.values(ctx.voteRecords).forEach(vr => {
    if (vr.info.proposal.toBase58() === proposal?.toBase58()) {
      voteRecords.push(vr);
    }
  });

  return voteRecords;
};
