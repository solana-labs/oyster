import React, { useContext, useEffect, useMemo, useState } from 'react';

import {
  AccountInfo,
  Connection,
  KeyedAccountInfo,
  PublicKey,
} from '@solana/web3.js';

import { useConnection, useConnectionConfig } from '@oyster/common';
import { GovernanceAccountParser } from '@solana/spl-governance';
import { GovernanceAccountType, Realm } from '@solana/spl-governance';
import { getRealms } from '@solana/spl-governance';
import { EventEmitter } from 'eventemitter3';

import { useLocation } from 'react-router-dom';
import { PROGRAM_VERSION } from '@solana/spl-governance';

import {
  getGovernanceProgramVersion,
  ProgramAccount,
} from '@solana/spl-governance';
import { arrayToRecord } from '../tools/script';

export interface GovernanceContextState {
  realms: Record<string, ProgramAccount<Realm>>;
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
  // For some reasons when a single emitter is used in prod it emits both remove and update events
  // As a workaround a single emitter per event is used
  private removeEmitter = new EventEmitter();
  private updateEmitter = new EventEmitter();

  onAccountRemoved(callback: (args: AccountRemovedEventArgs) => void) {
    this.removeEmitter.on(AccountRemovedEventArgs.name, callback);
    return () =>
      this.removeEmitter.removeListener(AccountRemovedEventArgs.name, callback);
  }

  notifyAccountRemoved(pubkey: string, accountType: GovernanceAccountType) {
    this.removeEmitter.emit(
      AccountRemovedEventArgs.name,
      new AccountRemovedEventArgs(pubkey, accountType),
    );
  }

  onAccountUpdated(callback: (args: AccountUpdatedEventArgs) => void) {
    this.updateEmitter.on(AccountUpdatedEventArgs.name, callback);
    return () =>
      this.updateEmitter.removeListener(AccountUpdatedEventArgs.name, callback);
  }

  notifyAccountUpdated(
    pubkey: string,
    accountType: GovernanceAccountType,
    accountInfo: AccountInfo<Buffer>,
  ) {
    this.updateEmitter.emit(
      AccountUpdatedEventArgs.name,
      new AccountUpdatedEventArgs(pubkey, accountType, accountInfo),
    );
  }

  async fetchAndNotifyAccountUpdated(
    connection: Connection,
    pubkey: PublicKey,
  ) {
    const info = await connection.getAccountInfo(pubkey, 'recent');
    if (info) {
      this.notifyAccountUpdated(pubkey.toBase58(), info.data[0], info);
    } else {
      console.error(`Can't fetch account for ${pubkey}`);
    }
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

    console.debug(
      'DEFAULT_GOVERNANCE_PROGRAM_ID',
      process.env.REACT_APP_DEFAULT_GOVERNANCE_PROGRAM_ID,
    );

    return (
      params.get('programId') ??
      process.env.REACT_APP_DEFAULT_GOVERNANCE_PROGRAM_ID ??
      'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw'
    );
  }, [location]);

  const [realms, setRealms] = useState({});
  const [changeTracker] = useState(new AccountChangeTracker());
  const [programVersion, setProgramVersion] = useState(PROGRAM_VERSION);

  useEffect(() => {
    const sub = (async () => {
      const programPk = new PublicKey(programId);

      try {
        const loadedRealms = await getRealms(connection, programPk);
        setRealms(arrayToRecord(loadedRealms, r => r.pubkey.toBase58()));
      } catch (ex) {
        console.error("Can't load Realms", ex);
        setRealms({});
      }

      // Use a single web socket subscription for all accounts and broadcast the updates using changeTracker
      // Note: Do not create other subscriptions for the given program id. They would be silently ignored by the rpc endpoint

      return connection.onProgramAccountChange(
        programPk,
        async (info: KeyedAccountInfo) => {
          if (
            info.accountInfo.data[0] === GovernanceAccountType.RealmV1 ||
            info.accountInfo.data[0] === GovernanceAccountType.RealmV2
          ) {
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
    getGovernanceProgramVersion(connection, new PublicKey(programId), env).then(
      pVersion => {
        console.debug('PROGRAM VERSION', { pVersion, env });
        setProgramVersion(pVersion);
      },
    );
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
