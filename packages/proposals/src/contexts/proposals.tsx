import React, { useContext, useEffect, useState } from 'react';

import {
  Connection,
  KeyedAccountInfo,
  PublicKeyAndAccount,
} from '@solana/web3.js';
import { useMemo } from 'react';

import { contexts, utils, ParsedAccount } from '@oyster/common';
import {
  TimelockSet,
  TimelockSetLayout,
  TimelockSetParser,
} from '../models/timelock';

const { useWallet } = contexts.Wallet;

const { useConnectionConfig } = contexts.Connection;
const { cache } = contexts.Accounts;

export interface ProposalsContextState {
  proposals: Record<string, ParsedAccount<TimelockSet>>;
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

  useSetupProposalsCache({ connection, setProposals });

  return (
    <ProposalsContext.Provider value={{ proposals }}>
      {children}
    </ProposalsContext.Provider>
  );
}

function useSetupProposalsCache({
  connection,
  setProposals,
}: {
  connection: Connection;
  setProposals: React.Dispatch<React.SetStateAction<{}>>;
}) {
  const PROGRAM_IDS = utils.programIds();

  useEffect(() => {
    const queryProposals = async () => {
      const programAccounts = await connection.getProgramAccounts(
        PROGRAM_IDS.timelock.programId,
      );
      return programAccounts;
    };
    Promise.all([queryProposals()]).then(
      (all: PublicKeyAndAccount<Buffer>[][]) => {
        const newProposals: Record<string, ParsedAccount<TimelockSet>> = {};
        all[0].forEach(a => {
          if (a.account.data.length === TimelockSetLayout.span) {
            cache.add(a.pubkey, a.account, TimelockSetParser);
            const cached = cache.get(a.pubkey) as ParsedAccount<TimelockSet>;
            console.log('Got', a.pubkey.toBase58());
            newProposals[a.pubkey.toBase58()] = cached;
          }
        });
        setProposals(newProposals);
      },
    );
    const subID = connection.onProgramAccountChange(
      PROGRAM_IDS.timelock.programId,
      async (info: KeyedAccountInfo) => {
        if (info.accountInfo.data.length === TimelockSetLayout.span) {
          cache.add(info.accountId, info.accountInfo, TimelockSetParser);
          const cached = cache.get(
            info.accountId,
          ) as ParsedAccount<TimelockSet>;
          setProposals(proposals => ({
            ...proposals,
            [typeof info.accountId === 'string'
              ? info.accountId
              : info.accountId.toBase58()]: cached,
          }));
        }
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
