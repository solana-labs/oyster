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
import {
  CustomSingleSignerTimelockTransactionLayout,
  CustomSingleSignerTimelockTransactionParser,
  TimelockConfig,
  TimelockConfigLayout,
  TimelockConfigParser,
  TimelockSet,
  TimelockState,
  TimelockSetLayout,
  TimelockSetParser,
  TimelockTransaction,
  TimelockStateParser,
  TimelockStateLayout,
  CustomSingleSignerTimelockTransaction,
} from '../models/timelock';

export interface ProposalsContextState {
  proposals: Record<string, ParsedAccount<TimelockSet>>;
  transactions: Record<string, ParsedAccount<TimelockTransaction>>;
  states: Record<string, ParsedAccount<TimelockState>>;
  configs: Record<string, ParsedAccount<TimelockConfig>>;
}

export const ProposalsContext = React.createContext<ProposalsContextState | null>(
  null,
);
export default function ProposalsProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();

  const connection = useMemo(() => new Connection(endpoint, 'recent'), [
    endpoint,
  ]);

  const [proposals, setProposals] = useState({});
  const [transactions, setTransactions] = useState({});
  const [states, setStates] = useState({});
  const [configs, setConfigs] = useState({});

  useSetupProposalsCache({
    connection,
    setProposals,
    setTransactions,
    setStates,
    setConfigs,
  });

  return (
    <ProposalsContext.Provider
      value={{ proposals, transactions, configs, states }}
    >
      {children}
    </ProposalsContext.Provider>
  );
}

function useSetupProposalsCache({
  connection,
  setProposals,
  setTransactions,
  setStates,
  setConfigs,
}: {
  connection: Connection;
  setProposals: React.Dispatch<React.SetStateAction<{}>>;
  setTransactions: React.Dispatch<React.SetStateAction<{}>>;
  setStates: React.Dispatch<React.SetStateAction<{}>>;
  setConfigs: React.Dispatch<React.SetStateAction<{}>>;
}) {
  const PROGRAM_IDS = utils.programIds();

  useEffect(() => {
    const query = async () => {
      const programAccounts = await connection.getProgramAccounts(
        PROGRAM_IDS.timelock.programId,
      );
      return programAccounts;
    };
    Promise.all([query()]).then((all: PublicKeyAndAccount<Buffer>[][]) => {
      const newProposals: Record<string, ParsedAccount<TimelockSet>> = {};
      const newTransactions: Record<
        string,
        ParsedAccount<TimelockTransaction>
      > = {};
      const newStates: Record<string, ParsedAccount<TimelockState>> = {};
      const newConfigs: Record<string, ParsedAccount<TimelockConfig>> = {};

      all[0].forEach(a => {
        let cached;
        switch (a.account.data.length) {
          case TimelockSetLayout.span:
            cache.add(a.pubkey, a.account, TimelockSetParser);
            cached = cache.get(a.pubkey) as ParsedAccount<TimelockSet>;
            newProposals[a.pubkey.toBase58()] = cached;
            break;
          case CustomSingleSignerTimelockTransactionLayout.span:
            cache.add(
              a.pubkey,
              a.account,
              CustomSingleSignerTimelockTransactionParser,
            );
            cached = cache.get(a.pubkey) as ParsedAccount<TimelockTransaction>;
            newTransactions[a.pubkey.toBase58()] = cached;
            break;
          case TimelockConfigLayout.span:
            cache.add(a.pubkey, a.account, TimelockConfigParser);
            cached = cache.get(a.pubkey) as ParsedAccount<TimelockConfig>;
            newConfigs[a.pubkey.toBase58()] = cached;
            break;
          case TimelockStateLayout.span:
            cache.add(a.pubkey, a.account, TimelockStateParser);
            cached = cache.get(a.pubkey) as ParsedAccount<TimelockState>;
            newStates[a.pubkey.toBase58()] = cached;
            break;
        }
      });

      setProposals(newProposals);
      setTransactions(newTransactions);
      setStates(newStates);
      setConfigs(newConfigs);
    });
    const subID = connection.onProgramAccountChange(
      PROGRAM_IDS.timelock.programId,
      async (info: KeyedAccountInfo) => {
        const pubkey = typeof info.accountId === 'string' ?
            new PublicKey((info.accountId as unknown) as string) :
            info.accountId;

        [
          [TimelockSetLayout.span, TimelockSetParser, setProposals],
          [
            CustomSingleSignerTimelockTransactionLayout.span,
            CustomSingleSignerTimelockTransactionParser,
            setTransactions,
          ],
          [TimelockStateLayout.span, TimelockStateParser, setStates],
          [TimelockConfigLayout.span, TimelockConfigParser, setConfigs],
        ].forEach(arr => {
          const [span, parser, setter] = arr;
          if (info.accountInfo.data.length === span) {
            cache.add(info.accountId, info.accountInfo, parser);
            let cached: any;
            switch (info.accountInfo.data.length) {
              case TimelockSetLayout.span:
                cached = cache.get(
                  pubkey,
                ) as ParsedAccount<TimelockSet>;
                break;
              case CustomSingleSignerTimelockTransactionLayout.span:
                cached = cache.get(
                  pubkey,
                ) as ParsedAccount<CustomSingleSignerTimelockTransaction>;
                break;
              case TimelockConfigLayout.span:
                cached = cache.get(
                  pubkey,
                ) as ParsedAccount<TimelockConfig>;
                break;
              case TimelockStateLayout.span:
                cached = cache.get(
                  pubkey,
                ) as ParsedAccount<TimelockState>;
                break;
            }
            setter((obj: any) => ({
              ...obj,
              [pubkey.toBase58()]: cached,
            }));
          }
        });
      },
      'singleGossip',
    );
    return () => {
      connection.removeProgramAccountChangeListener(subID);
    };
  }, [connection, PROGRAM_IDS.timelock.programId.toBase58()]);
}
export const useProposals = () => {
  const context = useContext(ProposalsContext);
  return context as ProposalsContextState;
};

export const useConfig = (id: string) => {
  const context = useContext(ProposalsContext);
  if (!context?.configs) {
    return;
  }

  return context.configs[id];
};
