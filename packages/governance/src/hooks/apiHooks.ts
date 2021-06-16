import { PublicKey } from '@solana/web3.js';

import { Governance, Proposal } from '../models/accounts';
import { getGovernancesByRealm, getProposalsByGovernance } from '../utils/api';
import { useGovernanceAccountByPubkey } from './useGovernanceAccountByPubkey';
import { useGovernanceAccountsBy } from './useGovernanceAccountsBy';

export function useGovernance(governance?: PublicKey) {
  return useGovernanceAccountByPubkey<Governance>(Governance, governance);
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccountsBy(Governance, getGovernancesByRealm, realm);
}

export const useProposal = (proposal: PublicKey) => {
  return useGovernanceAccountByPubkey<Proposal>(Proposal, proposal);
};

export const useProposalsByGovernance = (governance: PublicKey) => {
  return useGovernanceAccountsBy(
    Proposal,
    getProposalsByGovernance,
    governance,
  );
};
