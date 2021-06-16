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
  ProposalInstruction,
  Realm,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
} from '../models/accounts';
import { getGovernances, getGovernancesByRealm, getRealms } from '../utils/api';
import { useGovernanceAccountsBy } from '../hooks/useGovernanceAccountsBy';

export interface GovernanceContextState {
  realms: Record<string, ParsedAccount<Realm>>;
  governances: Record<string, ParsedAccount<Governance>>;
  tokenOwnerRecords: Record<string, ParsedAccount<TokenOwnerRecord>>;
  proposals: Record<string, ParsedAccount<Proposal>>;
  signatoryRecords: Record<string, ParsedAccount<SignatoryRecord>>;
  voteRecords: Record<string, ParsedAccount<VoteRecord>>;
  instructions: Record<string, ParsedAccount<ProposalInstruction>>;
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
  const [governances, setGovernances] = useState({});
  const [tokenOwnerRecords, setTokenOwnerRecords] = useState({});
  const [proposals, setProposals] = useState({});
  const [signatoryRecords, setSignatoryRecords] = useState({});
  const [voteRecords, setVoteRecords] = useState({});
  const [instructions, setInstructions] = useState({});

  useSetupGovernanceContext({
    connection,
    endpoint,
    setRealms,
    setGovernances,
    setTokenOwnerRecords,
    setProposals,
    setSignatoryRecords,
    setVoteRecords,
    setInstructions,
  });

  return (
    <GovernanceContext.Provider
      value={{
        realms,
        governances,
        tokenOwnerRecords,
        proposals,
        signatoryRecords,
        voteRecords,
        instructions,
        removeInstruction: removeCtxItem(setInstructions),
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
  setGovernances,
  setTokenOwnerRecords,
  setProposals,
  setSignatoryRecords,
  setVoteRecords,
  setInstructions,
}: {
  connection: Connection;
  endpoint: string;

  setRealms: React.Dispatch<React.SetStateAction<{}>>;
  setGovernances: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<Governance>>>
  >;
  setTokenOwnerRecords: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<TokenOwnerRecord>>>
  >;
  setProposals: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<Proposal>>>
  >;
  setSignatoryRecords: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<SignatoryRecord>>>
  >;
  setVoteRecords: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<VoteRecord>>>
  >;
  setInstructions: React.Dispatch<
    React.SetStateAction<Record<string, ParsedAccount<ProposalInstruction>>>
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
      const tokenOwnerRecords: Record<string, ParsedAccount<TokenOwnerRecord>> =
        {};
      const proposals: Record<string, ParsedAccount<Proposal>> = {};
      const signatoryRecords: Record<string, ParsedAccount<SignatoryRecord>> =
        {};
      const voteRecords: Record<string, ParsedAccount<VoteRecord>> = {};
      const instructions: Record<string, ParsedAccount<ProposalInstruction>> =
        {};

      all[0].forEach(a => {
        let cached;

        // TODO: This is done only for MVP to get it working end to end
        // All accounts should not be cached in the context and there is no need to update the global cache either

        switch (a.account.data[0]) {
          case GovernanceAccountType.TokenOwnerRecord: {
            cache.add(
              a.pubkey,
              a.account,
              BorshAccountParser(TokenOwnerRecord),
            );
            cached = cache.get(a.pubkey) as ParsedAccount<TokenOwnerRecord>;
            tokenOwnerRecords[a.pubkey.toBase58()] = cached;
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
            signatoryRecords[a.pubkey.toBase58()] = account;
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
          case GovernanceAccountType.ProposalInstruction: {
            const account = BorshAccountParser(ProposalInstruction)(
              a.pubkey,
              a.account,
            ) as ParsedAccount<ProposalInstruction>;
            instructions[a.pubkey.toBase58()] = account;

            break;
          }
        }
      });

      getRealms(endpoint).then(realms => setRealms(realms));
      getGovernances(endpoint).then(governances => setGovernances(governances));

      setTokenOwnerRecords(tokenOwnerRecords);
      setProposals(proposals);
      setSignatoryRecords(signatoryRecords);
      setVoteRecords(voteRecords);
      setInstructions(instructions);
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
          case GovernanceAccountType.AccountGovernance:
          case GovernanceAccountType.ProgramGovernance: {
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
          }
          case GovernanceAccountType.TokenOwnerRecord: {
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(TokenOwnerRecord),
            );

            setTokenOwnerRecords((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<TokenOwnerRecord>,
            }));

            break;
          }
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

            setSignatoryRecords((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<SignatoryRecord>,
            }));

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
          case GovernanceAccountType.ProposalInstruction: {
            cache.add(
              info.accountId,
              info.accountInfo,
              BorshAccountParser(ProposalInstruction),
            );

            setInstructions((objs: any) => ({
              ...objs,
              [pubkey.toBase58()]: cache.get(
                info.accountId,
              ) as ParsedAccount<ProposalInstruction>,
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

export function useRealmGovernances(realm: PublicKey | undefined) {
  return useGovernanceAccountsBy(realm, getGovernancesByRealm, Governance, [
    GovernanceAccountType.AccountGovernance,
    GovernanceAccountType.ProgramGovernance,
  ]);
}

export const useRealm = (realm?: PublicKey) => {
  const ctx = useGovernanceContext();

  return realm && ctx.realms[realm.toBase58()];
};

export const useGovernance = (governance?: PublicKey) => {
  const ctx = useGovernanceContext();

  return governance && ctx.governances[governance.toBase58()];
};

export const useWalletTokenOwnerRecord = (
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) => {
  const ctx = useGovernanceContext();
  const { wallet } = useWallet();

  if (!(realm && governingTokenMint)) {
    return null;
  }

  for (let record of Object.values(ctx.tokenOwnerRecords)) {
    if (
      record.info.governingTokenOwner.toBase58() ===
        wallet?.publicKey?.toBase58() &&
      record.info.realm.toBase58() === realm.toBase58() &&
      record.info.governingTokenMint.toBase58() ===
        governingTokenMint?.toBase58()
    ) {
      return record;
    }
  }

  return null;
};

export const useTokenOwnerRecords = (
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) => {
  const ctx = useGovernanceContext();
  const tokeOwnerRecords: ParsedAccount<TokenOwnerRecord>[] = [];

  Object.values(ctx.tokenOwnerRecords).forEach(tor => {
    if (
      tor.info.realm.toBase58() === realm?.toBase58() &&
      tor.info.governingTokenMint.toBase58() === governingTokenMint?.toBase58()
    ) {
      tokeOwnerRecords.push(tor);
    }
  });

  return tokeOwnerRecords;
};

export const useProposalOwnerRecord = (proposalOwner?: PublicKey) => {
  const ctx = useGovernanceContext();

  if (!proposalOwner) {
    return null;
  }

  return ctx.tokenOwnerRecords[proposalOwner.toBase58()];
};

export const useProposalAuthority = (proposalOwner?: PublicKey) => {
  const ctx = useGovernanceContext();
  const { wallet, connected } = useWallet();

  if (!proposalOwner) {
    return null;
  }

  const tokenOwnerRecord = ctx.tokenOwnerRecords[proposalOwner.toBase58()];

  return connected &&
    tokenOwnerRecord &&
    (tokenOwnerRecord.info.governingTokenOwner.toBase58() ===
      wallet?.publicKey?.toBase58() ||
      tokenOwnerRecord.info.governanceDelegate?.toBase58() ===
        wallet?.publicKey?.toBase58())
    ? tokenOwnerRecord
    : null;
};

export const useProposals = (governance: PublicKey) => {
  const ctx = useGovernanceContext();
  const proposals: ParsedAccount<Proposal>[] = [];

  Object.values(ctx.proposals).forEach(p => {
    if (p.info.governance.toBase58() === governance.toBase58()) {
      proposals.push(p);
    }
  });

  return proposals;
};

export const useProposal = (proposalKey: PublicKey) => {
  const ctx = useGovernanceContext();

  return ctx.proposals[proposalKey.toBase58()];
};

export const useSignatoryRecord = (proposal: PublicKey) => {
  const ctx = useGovernanceContext();
  const { wallet } = useWallet();

  for (let record of Object.values(ctx.signatoryRecords)) {
    if (
      record.info.signatory.toBase58() === wallet?.publicKey?.toBase58() &&
      record.info.proposal.toBase58() === proposal.toBase58()
    ) {
      return record;
    }
  }

  return null;
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

export const useInstructions = (proposal: PublicKey) => {
  const ctx = useGovernanceContext();

  const instructions: ParsedAccount<ProposalInstruction>[] = [];

  Object.values(ctx.instructions).forEach(p => {
    if (p.info.proposal.toBase58() === proposal.toBase58()) {
      instructions.push(p);
    }
  });

  return instructions;
};
