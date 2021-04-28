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
  CustomSingleSignerTransactionLayout,
  CustomSingleSignerTransactionParser,
  Governance,
  GovernanceLayout,
  GovernanceParser,
  Proposal,
  ProposalState,
  ProposalLayout,
  ProposalParser,
  GovernanceTransaction,
  ProposalStateParser,
  ProposalStateLayout,
  CustomSingleSignerTransaction,
} from '../models/governance';

export interface ProposalsContextState {
  proposals: Record<string, ParsedAccount<Proposal>>;
  transactions: Record<string, ParsedAccount<GovernanceTransaction>>;
  states: Record<string, ParsedAccount<ProposalState>>;
  configs: Record<string, ParsedAccount<Governance>>;
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
  useEffect(() => {
    const PROGRAM_IDS = utils.programIds();

    const query = async () => {
      const programAccounts = await connection.getProgramAccounts(
        PROGRAM_IDS.governance.programId,
      );
      return programAccounts;
    };
    Promise.all([query()]).then((all: PublicKeyAndAccount<Buffer>[][]) => {
      const newProposals: Record<string, ParsedAccount<Proposal>> = {};
      const newTransactions: Record<
        string,
        ParsedAccount<GovernanceTransaction>
      > = {};
      const newStates: Record<string, ParsedAccount<ProposalState>> = {};
      const newConfigs: Record<string, ParsedAccount<Governance>> = {};

      all[0].forEach(a => {
        let cached;
        switch (a.account.data.length) {
          case ProposalLayout.span:
            cache.add(a.pubkey, a.account, ProposalParser);
            cached = cache.get(a.pubkey) as ParsedAccount<Proposal>;
            newProposals[a.pubkey.toBase58()] = cached;
            break;
          case CustomSingleSignerTransactionLayout.span:
            cache.add(a.pubkey, a.account, CustomSingleSignerTransactionParser);
            cached = cache.get(
              a.pubkey,
            ) as ParsedAccount<GovernanceTransaction>;
            newTransactions[a.pubkey.toBase58()] = cached;
            break;
          case GovernanceLayout.span:
            cache.add(a.pubkey, a.account, GovernanceParser);
            cached = cache.get(a.pubkey) as ParsedAccount<Governance>;
            newConfigs[a.pubkey.toBase58()] = cached;
            break;
          case ProposalStateLayout.span:
            cache.add(a.pubkey, a.account, ProposalStateParser);
            cached = cache.get(a.pubkey) as ParsedAccount<ProposalState>;
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
      PROGRAM_IDS.governance.programId,
      async (info: KeyedAccountInfo) => {
        const pubkey = typeof info.accountId === 'string' ?
            new PublicKey((info.accountId as unknown) as string) :
            info.accountId;

        [
          [ProposalLayout.span, ProposalParser, setProposals],
          [
            CustomSingleSignerTransactionLayout.span,
            CustomSingleSignerTransactionParser,
            setTransactions,
          ],
          [ProposalStateLayout.span, ProposalStateParser, setStates],
          [GovernanceLayout.span, GovernanceParser, setConfigs],
        ].forEach(arr => {
          const [span, parser, setter] = arr;
          if (info.accountInfo.data.length === span) {
            cache.add(info.accountId, info.accountInfo, parser);
            let cached: any;
            switch (info.accountInfo.data.length) {
              case ProposalLayout.span:
                cached = cache.get(info.accountId) as ParsedAccount<Proposal>;
                break;
              case CustomSingleSignerTransactionLayout.span:
                cached = cache.get(
                  info.accountId,
                ) as ParsedAccount<CustomSingleSignerTransaction>;
                break;
              case GovernanceLayout.span:
                cached = cache.get(info.accountId) as ParsedAccount<Governance>;
                break;
              case ProposalStateLayout.span:
                cached = cache.get(
                  info.accountId,
                ) as ParsedAccount<ProposalState>;
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
  }, [connection]); //eslint-disable-line
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
