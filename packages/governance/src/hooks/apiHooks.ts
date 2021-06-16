import { PublicKey } from '@solana/web3.js';
import { Governance } from '../models/accounts';
import { getGovernancesByRealm } from '../utils/api';
import { useGovernanceAccountByPubkey } from './useGovernanceAccountByPubkey';
import { useGovernanceAccountsBy } from './useGovernanceAccountsBy';

export function useGovernance(governance?: PublicKey) {
  return useGovernanceAccountByPubkey<Governance>(Governance, governance);
}

export function useRealmGovernances(realm: PublicKey | undefined) {
  return useGovernanceAccountsBy(Governance, getGovernancesByRealm, realm);
}
