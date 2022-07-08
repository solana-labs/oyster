import { ProgramAccount, Realm } from '@solana/spl-governance';
import { useMemo } from 'react';
import { useRealmConfig } from './apiHooks';

export const useVestingProgramId = (realm?: ProgramAccount<Realm>) => {
  const realmConfig = useRealmConfig(realm?.pubkey);

  return useMemo(() => {
    return realmConfig?.account.communityVoterWeightAddin;
  }, [realmConfig]);
};
