import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { getGovernanceUrl } from '../tools/routeTools';
import { useRpcContext } from './useRpcContext';

export type GovernanceMeta = {
  pubkey: PublicKey | undefined,
  href: string,
  name: string,
}

export const useGovernanceMeta = (
  governance: PublicKey | undefined,
) => {
  const { programIdBase58 } = useRpcContext();

  return useMemo<GovernanceMeta>(() => {
    let meta: GovernanceMeta = {
      pubkey: undefined,
      href: '#',
      name: 'Loading',
    };

    if (governance) {
      meta = {
        pubkey: governance,
        href: '#' + getGovernanceUrl(governance, programIdBase58),
        name: 'Gov#' + governance.toString().substr(0, 5),
      };
    }

    return meta;
  }, [governance, programIdBase58]);
};
