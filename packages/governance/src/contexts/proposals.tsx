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
import {
  Governance,
  GovernanceAccountType,
  Proposal,
  Realm,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
} from '../models/accounts';

export interface ProposalsContextState {
  realms: Record<string, ParsedAccount<Realm>>;
  governances: Record<string, ParsedAccount<Governance>>;
  tokenOwnerRecords: Map<string, ParsedAccount<TokenOwnerRecord>>;
  proposals: Record<string, ParsedAccount<Proposal>>;
  signatoryRecords: Map<string, ParsedAccount<SignatoryRecord>>;
  voteRecords: Record<string, ParsedAccount<VoteRecord>>;
}

export const ProposalsContext =
  React.createContext<ProposalsContextState | null>(null);

export default function ProposalsProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();

  const connection = useMemo(
    () => new Connection(endpoint, 'recent'),
    [endpoint],
  );

  const [realms, setRealms] = useState({});
  const [governances, setGovernances] = useState({});
  const [tokenOwnerRecords, setTokenOwnerRecords] = useState(
    new Map<string, ParsedAccount<TokenOwnerRecord>>(),
  );
  const [proposals, setProposals] = useState({});
  const [signatoryRecords, setSignatoryRecords] = useState(
    new Map<string, ParsedAccount<SignatoryRecord>>(),
  );
  const [voteRecords, setVoteRecords] = useState({});

  useSetupProposalsCache({
    connection,
    setRealms,
    setGovernances,
    setTokenOwnerRecords,
    setProposals,
    setSignatoryRecords,
    setVoteRecords,
  });

  return (
    <ProposalsContext.Provider
      value={{
        realms,
        governances,
        tokenOwnerRecords,
        proposals,
        signatoryRecords,
        voteRecords,
      }}
    >
      {children}
    </ProposalsContext.Provider>
  );
}

function useSetupProposalsCache({
  connection,
  setRealms,
  setGovernances,
  setTokenOwnerRecords,
  setProposals,
  setSignatoryRecords,
  setVoteRecords,
}: {
  connection: Connection;

  setRealms: React.Dispatch<React.SetStateAction<{}>>;
  setGovernances: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<Governance>>>
  >;
  setTokenOwnerRecords: React.Dispatch<
    React.SetStateAction<Map<string, ParsedAccount<TokenOwnerRecord>>>
  >;
  setProposals: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<Proposal>>>
  >;
  setSignatoryRecords: React.Dispatch<
    React.SetStateAction<Map<string, ParsedAccount<SignatoryRecord>>>
  >;
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
      const realms: Record<string, ParsedAccount<Realm>> = {};
      const governances: Record<string, ParsedAccount<Governance>> = {};
      const tokenOwnerRecords = new Map<
        string,
        ParsedAccount<TokenOwnerRecord>
      >();
      const proposals: Record<string, ParsedAccount<Proposal>> = {};
      const signatoryRecords = new Map<
        string,
        ParsedAccount<SignatoryRecord>
      >();
      const voteRecords: Record<string, ParsedAccount<VoteRecord>> = {};

      all[0].forEach(a => {
        let cached;

        switch (a.account.data[0]) {
          case GovernanceAccountType.Realm:
            cache.add(a.pubkey, a.account, BorshAccountParser(Realm));
            cached = cache.get(a.pubkey) as ParsedAccount<Realm>;
            realms[a.pubkey.toBase58()] = cached;
            break;
          case GovernanceAccountType.AccountGovernance: {
            cache.add(a.pubkey, a.account, BorshAccountParser(Governance));
            cached = cache.get(a.pubkey) as ParsedAccount<Governance>;
            governances[a.pubkey.toBase58()] = cached;
            break;
          }
          case GovernanceAccountType.TokenOwnerRecord: {
            cache.add(
              a.pubkey,
              a.account,
              BorshAccountParser(TokenOwnerRecord),
            );
            cached = cache.get(a.pubkey) as ParsedAccount<TokenOwnerRecord>;
            tokenOwnerRecords.set(a.pubkey.toBase58(), cached);
            break;
          }
          case GovernanceAccountType.Proposal: {
            cache.add(a.pubkey, a.account, BorshAccountParser(Proposal));
            cached = cache.get(a.pubkey) as ParsedAccount<Proposal>;
            proposals[a.pubkey.toBase58()] = cached;
            break;
          }
          case GovernanceAccountType.SignatoryRecord: {
            const account = BorshAccountParser(SignatoryRecord)(
              a.pubkey,
              a.account,
            ) as ParsedAccount<SignatoryRecord>;
            signatoryRecords.set(a.pubkey.toBase58(), account);
            break;
          }
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

      setRealms(realms);
      setGovernances(governances);
      setTokenOwnerRecords(tokenOwnerRecords);
      setProposals(proposals);
      setSignatoryRecords(signatoryRecords);
      setVoteRecords(voteRecords);
    });
    const subID = connection.onProgramAccountChange(
      PROGRAM_IDS.governance.programId,
      async (info: KeyedAccountInfo) => {
        const pubkey =
          typeof info.accountId === 'string'
            ? new PublicKey(info.accountId as unknown as string)
            : info.accountId;

        //     return;

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
          case GovernanceAccountType.AccountGovernance:
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(Governance),
            );

            setGovernances((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<Governance>,
            }));
            break;

          case GovernanceAccountType.TokenOwnerRecord:
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(TokenOwnerRecord),
            );

            setTokenOwnerRecords(map => {
              map.set(
                pubkey.toBase58(),
                cache.get(info.accountId) as ParsedAccount<TokenOwnerRecord>,
              );
              return map;
            });
            break;
          case GovernanceAccountType.Proposal: {
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(Proposal),
            );

            setProposals((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<Proposal>,
            }));

            break;
          }
          case GovernanceAccountType.SignatoryRecord: {
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(SignatoryRecord),
            );

            setSignatoryRecords(map => {
              map.set(
                pubkey.toBase58(),
                cache.get(info.accountId) as ParsedAccount<SignatoryRecord>,
              );
              return map;
            });
            break;
          }
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
export const useGovernanceAccounts = () => {
  const context = useContext(ProposalsContext);
  return context as ProposalsContextState;
};

export const useRealms = () => {
  const ctx = useGovernanceAccounts();

  return Object.values(ctx.realms);
};

export const useRealmGovernances = (realm: PublicKey) => {
  const ctx = useGovernanceAccounts();
  const governances: ParsedAccount<Governance>[] = [];

  Object.values(ctx.governances).forEach(g => {
    if (g.info.config.realm.toBase58() === realm.toBase58()) {
      governances.push(g);
    }
  });

  return governances;
};

export const useRealm = (realm: PublicKey | undefined) => {
  const ctx = useGovernanceAccounts();
  if (!realm) {
    return null;
  }

  return ctx.realms[realm.toBase58()];
};

export const useGovernance = (governance?: PublicKey) => {
  const ctx = useGovernanceAccounts();

  return governance && ctx.governances[governance.toBase58()];
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

export const useProposals = (governance: PublicKey) => {
  const ctx = useGovernanceAccounts();
  const proposals: ParsedAccount<Proposal>[] = [];

  Object.values(ctx.proposals).forEach(p => {
    if (p.info.governance.toBase58() === governance.toBase58()) {
      proposals.push(p);
    }
  });

  return proposals;
};

export const useProposal = (proposalKey: PublicKey) => {
  const ctx = useGovernanceAccounts();

  return ctx.proposals[proposalKey.toBase58()];
};

export const useSignatoryRecord = (proposal: PublicKey) => {
  const ctx = useGovernanceAccounts();
  const { wallet } = useWallet();

  for (let record of ctx.signatoryRecords.values()) {
    if (
      record.info.signatory.toBase58() === wallet?.publicKey?.toBase58() &&
      record.info.proposal.toBase58() === proposal.toBase58()
    ) {
      return record;
    }
  }

  return null;
};
