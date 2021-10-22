import React, { useContext, useEffect, useMemo, useState } from 'react';

import { AccountInfo, KeyedAccountInfo, PublicKey } from '@solana/web3.js';

import {
  ParsedAccount,
  useConnection,
  useConnectionConfig,
} from '@oyster/common';
import { GovernanceAccountParser } from '../models/serialisation';
import { GovernanceAccountType, Realm } from '../models/accounts';
import { getRealms } from '../models/api';
import { EventEmitter } from 'eventemitter3';

import { useLocation } from 'react-router-dom';
import { getProgramVersion, PROGRAM_VERSION } from '../models/registry/api';

export interface GovernanceContextState {
  realms: Record<string, ParsedAccount<Realm>>;
  changeTracker: AccountChangeTracker;
  programId: string;
  programVersion: number;
}

class AccountRemovedEventArgs {
  pubkey: string;
  accountType: GovernanceAccountType;

  constructor(pubkey: string, accountType: GovernanceAccountType) {
    this.pubkey = pubkey;
    this.accountType = accountType;
  }
}

// An event raised when account was updated or inserted
class AccountUpdatedEventArgs {
  pubkey: string;
  accountType: GovernanceAccountType;
  accountInfo: AccountInfo<Buffer>;

  constructor(
    pubkey: string,
    accountType: GovernanceAccountType,
    accountInfo: AccountInfo<Buffer>,
  ) {
    this.pubkey = pubkey;
    this.accountType = accountType;
    this.accountInfo = accountInfo;
  }
}

// Tracks local changes not supported by connection notifications
class AccountChangeTracker {
  private emitter = new EventEmitter();

  onAccountRemoved(callback: (args: AccountRemovedEventArgs) => void) {
    this.emitter.on(AccountRemovedEventArgs.name, callback);
    return () =>
      this.emitter.removeListener(AccountRemovedEventArgs.name, callback);
  }

  notifyAccountRemoved(pubkey: string, accountType: GovernanceAccountType) {
    console.log('NOTIFY REMOVED', pubkey);
    this.emitter.emit(
      AccountRemovedEventArgs.name,
      new AccountRemovedEventArgs(pubkey, accountType),
    );
  }

  onAccountUpdated(callback: (args: AccountUpdatedEventArgs) => void) {
    this.emitter.on(AccountUpdatedEventArgs.name, callback);
    return () =>
      this.emitter.removeListener(AccountUpdatedEventArgs.name, callback);
  }

  notifyAccountUpdated(
    pubkey: string,
    accountType: GovernanceAccountType,
    accountInfo: AccountInfo<Buffer>,
  ) {
    console.log('NOTIFY UPDATED', pubkey);
    this.emitter.emit(
      AccountUpdatedEventArgs.name,
      new AccountUpdatedEventArgs(pubkey, accountType, accountInfo),
    );
  }
}

export const GovernanceContext =
  React.createContext<GovernanceContextState | null>(null);

export default function GovernanceProvider({ children = null as any }) {
  const connection = useConnection();
  const { endpoint, env } = useConnectionConfig();
  const location = useLocation();

  const programId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (
      params.get('programId') ?? 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw'
    );
  }, [location]);

  const [realms, setRealms] = useState({});
  const [changeTracker] = useState(new AccountChangeTracker());
  const [programVersion, setProgramVersion] = useState(PROGRAM_VERSION);

  useEffect(() => {
    const sub = (async () => {
      const programPk = new PublicKey(programId);

      try {
        const loadedRealms = await getRealms(endpoint, programPk);
        setRealms(loadedRealms);
      } catch (ex) {
        console.error("Can't load Realms", ex);
        setRealms({});
      }

      // Use a single web socket subscription for all accounts and broadcast the updates using changeTracker
      // Note: Do not create other subscriptions for the given program id. They would be silently ignored by the rpc endpoint

      console.log('SUBSCRIBING...');
      return connection.onProgramAccountChange(
        programPk,
        async (info: KeyedAccountInfo) => {
          console.log('ACCOUNT UPDATED (CTX)', info);

          if (info.accountInfo.data[0] === GovernanceAccountType.Realm) {
            const realm = GovernanceAccountParser(Realm)(
              info.accountId,
              info.accountInfo,
            );
            setRealms((objs: any) => ({
              ...objs,
              [info.accountId.toBase58()]: realm,
            }));
          }
          changeTracker.notifyAccountUpdated(
            info.accountId.toBase58(),
            info.accountInfo.data[0],
            info.accountInfo,
          );
        },
      );
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
  }, [connection, programId, endpoint]); //eslint-disable-line

  useEffect(() => {
    getProgramVersion(connection, programId, env).then(pVersion => {
      console.log('PROGRAM VERSION', { pVersion, env });
      setProgramVersion(pVersion);
    });
  }, [env, connection, programId]);

  return (
    <GovernanceContext.Provider
      value={{
        realms,
        changeTracker,
        programVersion,
        programId,
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
}

export function useGovernanceContext() {
  const context = useContext(GovernanceContext);
  return context as GovernanceContextState;
}

export function useProgramInfo() {
  const context = useGovernanceContext();
  return {
    programVersion: context.programVersion,
    programId: context.programId,
  };
}

export function useAccountChangeTracker() {
  const context = useGovernanceContext();
  return context.changeTracker;
}

export function useRealms() {
  const ctx = useGovernanceContext();
  return Object.values(ctx.realms);
}

export function useRealm(realm: PublicKey | undefined) {
  const ctx = useGovernanceContext();
  return realm && ctx.realms[realm.toBase58()];
}
