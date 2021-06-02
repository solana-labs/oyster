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
import {
  CustomSingleSignerTransactionLayout,
  CustomSingleSignerTransactionParser,
  GovernanceOld,
  GovernanceLayout,
  GovernanceOldParser,
  Proposal,
  ProposalState,
  ProposalLayout,
  ProposalParser,
  GovernanceTransaction,
  ProposalStateParser,
  ProposalStateLayout,
  CustomSingleSignerTransaction,
  RealmParser,
  GovernanceParser,
  TokenOwnerRecordParser,
} from '../models/serialisation';
import {
  Governance,
  GovernanceAccountType,
  Realm,
  TokenOwnerRecord,
} from '../models/accounts';

export interface ProposalsContextState {
  proposals: Record<string, ParsedAccount<Proposal>>;
  transactions: Record<string, ParsedAccount<GovernanceTransaction>>;
  states: Record<string, ParsedAccount<ProposalState>>;
  configs: Record<string, ParsedAccount<GovernanceOld>>;
  realms: Record<string, ParsedAccount<Realm>>;
  governances: Map<string, ParsedAccount<Governance>>;
  tokenOwnerRecords: Map<string, ParsedAccount<TokenOwnerRecord>>;
}

export const ProposalsContext =
  React.createContext<ProposalsContextState | null>(null);
export default function ProposalsProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();

  const connection = useMemo(
    () => new Connection(endpoint, 'recent'),
    [endpoint],
  );

  const [proposals, setProposals] = useState({});
  const [transactions, setTransactions] = useState({});
  const [states, setStates] = useState({});
  const [configs, setConfigs] = useState({});
  const [realms, setRealms] = useState({});
  const [governances, setGovernances] = useState(
    new Map<string, ParsedAccount<Governance>>(),
  );
  const [tokenOwnerRecords, setTokenOwnerRecords] = useState(
    new Map<string, ParsedAccount<TokenOwnerRecord>>(),
  );

  useSetupProposalsCache({
    connection,
    setProposals,
    setTransactions,
    setStates,
    setConfigs,
    setRealms,
    setGovernances,
    setTokenOwnerRecords,
  });

  return (
    <ProposalsContext.Provider
      value={{
        proposals,
        transactions,
        configs,
        states,
        realms,
        governances,
        tokenOwnerRecords,
      }}
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
  setRealms,
  setGovernances,
  setTokenOwnerRecords,
}: {
  connection: Connection;
  setProposals: React.Dispatch<React.SetStateAction<{}>>;
  setTransactions: React.Dispatch<React.SetStateAction<{}>>;
  setStates: React.Dispatch<React.SetStateAction<{}>>;
  setConfigs: React.Dispatch<React.SetStateAction<{}>>;
  setRealms: React.Dispatch<React.SetStateAction<{}>>;
  setGovernances: React.Dispatch<
    React.SetStateAction<Map<string, ParsedAccount<Governance>>>
  >;
  setTokenOwnerRecords: React.Dispatch<
    React.SetStateAction<Map<string, ParsedAccount<TokenOwnerRecord>>>
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
      const newProposals: Record<string, ParsedAccount<Proposal>> = {};
      const newTransactions: Record<
        string,
        ParsedAccount<GovernanceTransaction>
      > = {};
      const newStates: Record<string, ParsedAccount<ProposalState>> = {};
      const newConfigs: Record<string, ParsedAccount<GovernanceOld>> = {};
      const newRealms: Record<string, ParsedAccount<Realm>> = {};
      const newGovernances = new Map<string, ParsedAccount<Governance>>();
      const newTokenOwnerRecords = new Map<
        string,
        ParsedAccount<TokenOwnerRecord>
      >();

      all[0].forEach(a => {
        let cached;

        if (a.account.data[0] === GovernanceAccountType.Realm) {
          cache.add(a.pubkey, a.account, RealmParser);
          cached = cache.get(a.pubkey) as ParsedAccount<Realm>;
          newRealms[a.pubkey.toBase58()] = cached;
        } else if (
          a.account.data[0] === GovernanceAccountType.AccountGovernance
        ) {
          cache.add(a.pubkey, a.account, GovernanceParser);
          cached = cache.get(a.pubkey) as ParsedAccount<Governance>;
          newGovernances.set(a.pubkey.toBase58(), cached);
        } else if (
          a.account.data[0] === GovernanceAccountType.TokenOwnerRecord
        ) {
          cache.add(a.pubkey, a.account, TokenOwnerRecordParser);
          cached = cache.get(a.pubkey) as ParsedAccount<TokenOwnerRecord>;
          newTokenOwnerRecords.set(a.pubkey.toBase58(), cached);
        }

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
            cache.add(a.pubkey, a.account, GovernanceOldParser);
            cached = cache.get(a.pubkey) as ParsedAccount<GovernanceOld>;
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
      setRealms(newRealms);
      setGovernances(newGovernances);
      setTokenOwnerRecords(newTokenOwnerRecords);
    });
    const subID = connection.onProgramAccountChange(
      PROGRAM_IDS.governance.programId,
      async (info: KeyedAccountInfo) => {
        const pubkey =
          typeof info.accountId === 'string'
            ? new PublicKey(info.accountId as unknown as string)
            : info.accountId;

        if (info.accountInfo.data[0] === GovernanceAccountType.Realm) {
          cache.add(info.accountId, info.accountInfo, RealmParser);
          let cached = cache.get(info.accountId) as ParsedAccount<Realm>;

          setRealms((objs: any) => ({
            ...objs,
            [pubkey.toBase58()]: cached,
          }));
        } else if (
          info.accountInfo.data[0] === GovernanceAccountType.AccountGovernance
        ) {
          cache.add(info.accountId, info.accountInfo, GovernanceParser);
          let cached = cache.get(info.accountId) as ParsedAccount<Governance>;

          setGovernances(map => {
            map.set(pubkey.toBase58(), cached);
            return map;
          });
        } else if (
          info.accountInfo.data[0] === GovernanceAccountType.TokenOwnerRecord
        ) {
          cache.add(info.accountId, info.accountInfo, TokenOwnerRecordParser);
          let cached = cache.get(
            info.accountId,
          ) as ParsedAccount<TokenOwnerRecord>;

          setTokenOwnerRecords(map => {
            map.set(pubkey.toBase58(), cached);
            return map;
          });
        }

        [
          [ProposalLayout.span, ProposalParser, setProposals],
          [
            CustomSingleSignerTransactionLayout.span,
            CustomSingleSignerTransactionParser,
            setTransactions,
          ],
          [ProposalStateLayout.span, ProposalStateParser, setStates],
          [GovernanceLayout.span, GovernanceOldParser, setConfigs],
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
                cached = cache.get(
                  info.accountId,
                ) as ParsedAccount<GovernanceOld>;
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
export const useGovernanceAccounts = () => {
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

export const useRealms = () => {
  const ctx = useGovernanceAccounts();
  return Object.values(ctx.realms);
};

export const useRealmGovernances = (realm: PublicKey) => {
  const ctx = useGovernanceAccounts();
  const governances: ParsedAccount<Governance>[] = [];

  ctx.governances.forEach(g => {
    if (g.info.config.realm.toBase58() === realm.toBase58()) {
      governances.push(g);
    }
  });

  return governances;
};

export const useRealm = (realm: PublicKey) => {
  const ctx = useGovernanceAccounts();
  return ctx.realms[realm.toBase58()];
};

export const useGovernance = (governance: PublicKey) => {
  const ctx = useGovernanceAccounts();
  return ctx.governances.get(governance.toBase58());
};

export const useTokenOwnerRecord = (realm?: PublicKey) => {
  const ctx = useGovernanceAccounts();
  const { wallet } = useWallet();

  if (!realm) {
    return null;
  }

  for (let record of ctx.tokenOwnerRecords.values()) {
    if (
      record.info.governingTokenOwner.toBase58() ===
        wallet?.publicKey?.toBase58() &&
      record.info.realm.toBase58() === realm.toBase58()
    ) {
      return record;
    }
  }

  return null;
};
