import { PublicKey } from '@solana/web3.js';
import { ENV, useConnectionConfig } from '@oyster/common';
import { useMemo } from 'react';
import { getGovernanceUrl } from '../tools/routeTools';
import { GovernanceMetaEnvMap } from '../constants';
import { useProgramInfo } from '../contexts/GovernanceContext';

export type GovernanceMeta = {
  pubkey: PublicKey;
  href: string;
  name: string;
};

export const governanceName = (governance: PublicKey): string => {
  const key = governance.toBase58();
  return `Governance #${key.substring(0, 4)}..${key.slice(-4)}`;
};

// get governance extra meta from map
export const getGovernanceMeta = (
  network: ENV,
  governance: PublicKey | string,
  programId: PublicKey | string,
) => {
  if (GovernanceMetaEnvMap.has(network)) {
    const governanceMeta = GovernanceMetaEnvMap.get(network);
    const extra = governanceMeta?.find(
      meta =>
        meta.programId === programId.toString() &&
        meta.address === governance.toString(),
    );
    const pubkey =
      governance instanceof PublicKey ? governance : new PublicKey(governance);
    const meta: GovernanceMeta = {
      pubkey,
      href: `#${getGovernanceUrl(governance, programId)}`,
      name: extra?.name ? extra.name : governanceName(pubkey),
    };
    return meta;
  }
};

// hook with memoized governance info
export const useGovernanceMeta = (governance?: PublicKey) => {
  const { programId } = useProgramInfo();
  const { env } = useConnectionConfig();

  return useMemo<GovernanceMeta | undefined>(() => {
    if (governance) {
      return getGovernanceMeta(env, governance, programId);
    }
  }, [env, governance, programId]);
};
