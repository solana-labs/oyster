import React, { useContext } from 'react';
import { ProgramAccount, Realm } from '@solana/spl-governance';
import { useAccountByMint, useUserAccounts } from '@oyster/common';
import { DepositedAccountInfo, useDepositedAccounts } from '../../hooks/useDepositedAccounts';
import { useRpcContext } from '../../hooks/useRpcContext';
import { useRealmConfig } from '../../hooks/apiHooks';

const DepositsContext = React.createContext<any>({});

export function useDepositedAccountsContext(): { depositedAccounts: DepositedAccountInfo[] | null, realm?: ProgramAccount<Realm> } {
  return useContext(DepositsContext);
}

export function DepositsProvider({ children, realm }: { children: any, realm?: ProgramAccount<Realm> }) {
  const rpcContext = useRpcContext();
  const realmConfig = useRealmConfig(realm?.pubkey);
  const vestingProgramId = realmConfig?.account.communityVoterWeightAddin;
  const governingTokenAccount = useAccountByMint(realm?.account.communityMint);
  const { userAccounts } = useUserAccounts();
  const depositedAccounts = useDepositedAccounts(
    rpcContext,
    vestingProgramId,
    rpcContext.wallet?.publicKey!,
    realm?.account.communityMint,
    governingTokenAccount,
    userAccounts
  );

  return (
    <DepositsContext.Provider value={{ depositedAccounts, realm }}>
      {children}
    </DepositsContext.Provider>
  );
}
