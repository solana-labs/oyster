import { PublicKey } from '@solana/web3.js';

import { Governance, Proposal } from '../models/accounts';
import { pubkeyFilter } from '../utils/api';
import { useGovernanceAccountByPubkey } from './useGovernanceAccountByPubkey';
import { useGovernanceAccountsByFilter } from './useGovernanceAccountsByFilter';

export function useGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Governance>(Governance, governance);
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Governance>(Governance, [
    pubkeyFilter(1, realm),
  ]);
}

export const useProposal = (proposal: PublicKey | undefined) => {
  return useGovernanceAccountByPubkey<Proposal>(Proposal, proposal);
};

export const useProposalsByGovernance = (governance: PublicKey | undefined) => {
  return useGovernanceAccountsByFilter<Proposal>(Proposal, [
    pubkeyFilter(1, governance),
  ]);
};
