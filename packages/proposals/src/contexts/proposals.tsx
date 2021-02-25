import React, { useContext, useEffect, useState } from 'react';

import {
  Connection,
  KeyedAccountInfo,
  PublicKeyAndAccount,
} from '@solana/web3.js';
import { useMemo } from 'react';

import { contexts, utils, ParsedAccount } from '@oyster/common';
import {
  CustomSingleSignerTimelockTransaction,
  CustomSingleSignerTimelockTransactionLayout,
  CustomSingleSignerTimelockTransactionParser,
  TimelockSet,
  TimelockSetLayout,
  TimelockSetParser,
  Transaction,
} from '../models/timelock';

const { useConnectionConfig } = contexts.Connection;
const { cache } = contexts.Accounts;

export interface ProposalsContextState {
  proposals: Record<string, ParsedAccount<TimelockSet>>;
  transactions: Record<string, ParsedAccount<Transaction>>;
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

  useSetupProposalsCache({
    connection,
    setProposals,
    setTransactions,
  });

  return (
    <ProposalsContext.Provider value={{ proposals, transactions }}>
      {children}
    </ProposalsContext.Provider>
  );
}

function useSetupProposalsCache({
  connection,
  setProposals,
  setTransactions,
}: {
  connection: Connection;
  setProposals: React.Dispatch<React.SetStateAction<{}>>;
  setTransactions: React.Dispatch<React.SetStateAction<{}>>;
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
      const newTransactions: Record<string, ParsedAccount<Transaction>> = {};

      all[0].forEach(a => {
        if (a.account.data.length === TimelockSetLayout.span) {
          cache.add(a.pubkey, a.account, TimelockSetParser);
          const cached = cache.get(a.pubkey) as ParsedAccount<TimelockSet>;
          newProposals[a.pubkey.toBase58()] = cached;
        }
        if (
          a.account.data.length ===
          CustomSingleSignerTimelockTransactionLayout.span
        ) {
          cache.add(
            a.pubkey,
            a.account,
            CustomSingleSignerTimelockTransactionParser,
          );
          const cached = cache.get(a.pubkey) as ParsedAccount<Transaction>;
          newTransactions[a.pubkey.toBase58()] = cached;
        }
      });
      setProposals(newProposals);
    });
    const subID = connection.onProgramAccountChange(
      PROGRAM_IDS.timelock.programId,
      async (info: KeyedAccountInfo) => {
        [
          [TimelockSetLayout.span, TimelockSetParser, setProposals],
          [
            CustomSingleSignerTimelockTransactionLayout.span,
            CustomSingleSignerTimelockTransactionParser,
            setTransactions,
          ],
        ].forEach(arr => {
          const [span, parser, setter] = arr;
          if (info.accountInfo.data.length === span) {
            cache.add(info.accountId, info.accountInfo, parser);
            const cached =
              span === TimelockSetLayout.span
                ? (cache.get(info.accountId) as ParsedAccount<TimelockSet>)
                : (cache.get(info.accountId) as ParsedAccount<Transaction>);
            setter((obj: any) => ({
              ...obj,
              [typeof info.accountId === 'string'
                ? info.accountId
                : info.accountId.toBase58()]: cached,
            }));
          }
        });
      },
      'singleGossip',
    );
    return () => {
      connection.removeProgramAccountChangeListener(subID);
    };
  }, [connection, PROGRAM_IDS.timelock.programAccountId]);
}
export const useProposals = () => {
  const context = useContext(ProposalsContext);
  return context as ProposalsContextState;
};
