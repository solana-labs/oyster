import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { getGovernanceUrl } from '../tools/routeTools';
import { useRpcContext } from './useRpcContext';
import { GovernanceMetaMap } from '../constants/governanceMeta';

export type GovernanceMeta = {
  pubkey: PublicKey,
  href: string,
  name: string,
}

// get governance extra meta from map
export const getGovernanceMeta = (
  governance: PublicKey | string,
  programId: PublicKey | string,
) => {
  const extra = GovernanceMetaMap.find(
    (meta) =>
      meta.programId === programId.toString()
      && meta.address === governance.toString(),
  );

  const meta: GovernanceMeta = {
    pubkey: governance instanceof PublicKey
      ? governance : new PublicKey(governance),
    href: '#' + getGovernanceUrl(governance, programId),
    name: extra?.name || [
      'Governance #',
      governance.toString().substring(0, 4),
      '...',
      governance.toString().slice(-4),
    ].join(''),
  };

  return meta;
};

// hook with memoized governance info
export const useGovernanceMeta = (
  governance: PublicKey | undefined,
) => {
  const { programIdBase58: programId } = useRpcContext();

  return useMemo<GovernanceMeta | null>(() => {
    if (governance) {
      return getGovernanceMeta(governance, programId);
    }
    return null;
  }, [governance, programId]);
};
