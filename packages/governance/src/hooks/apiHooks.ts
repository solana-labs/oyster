import { PublicKey } from '@solana/web3.js';

import {
  getSignatoryRecordAddress,
  getTokenOwnerAddress,
  getVoteRecordAddress,
  Governance,
  Proposal,
  ProposalInstruction,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
} from '../models/accounts';
import { pubkeyFilter } from '../models/api';
import {
  useGovernanceAccountByPda,
  useGovernanceAccountByPubkey,
  useGovernanceAccountsByFilter,
} from './accountHooks';

import { useWallet } from '@oyster/common';
import { useRpcContext } from './useRpcContext';

// ----- Governance -----

export function useGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Governance>(
    Governance,
    governance,
  )?.tryUnwrap();
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Governance>(Governance, [
    pubkeyFilter(1, realm),
  ]);
}

// ----- Proposal -----

export function useProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Proposal>(
    Proposal,
    proposal,
  )?.tryUnwrap();
}

export function useProposalsByGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Proposal>(Proposal, [
    pubkeyFilter(1, governance),
  ]);
}

// ----- TokenOwnerRecord -----

export function useTokenOwnerRecord(tokenOwnerRecord: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<TokenOwnerRecord>(
    TokenOwnerRecord,
    tokenOwnerRecord,
  );
}

export function useTokenOwnerRecords(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) {
  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1, realm),
    pubkeyFilter(1 + 32, governingTokenMint),
  ]);
}

export function useWalletTokenOwnerRecord(
  realm: PublicKey | undefined,
  governingTokenMint: PublicKey | undefined,
) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<TokenOwnerRecord>(
    TokenOwnerRecord,
    async () => {
      if (!realm || !wallet?.publicKey || !governingTokenMint) {
        return;
      }

      return await getTokenOwnerAddress(
        programId,
        realm,
        governingTokenMint,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, governingTokenMint, realm],
  )?.tryUnwrap();
}

/// Returns all TokenOwnerRecords for the current wallet
export function useWalletTokenOwnerRecords() {
  const { wallet } = useWallet();

  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, wallet?.publicKey),
  ]);
}

export function useProposalAuthority(proposalOwner: PublicKey | undefined) {
  const { wallet, connected } = useWallet();
  const tokenOwnerRecord = useTokenOwnerRecord(proposalOwner);

  return connected &&
    tokenOwnerRecord?.isSome() &&
    (tokenOwnerRecord.value.info.governingTokenOwner.toBase58() ===
      wallet?.publicKey?.toBase58() ||
      tokenOwnerRecord.value.info.governanceDelegate?.toBase58() ===
        wallet?.publicKey?.toBase58())
    ? tokenOwnerRecord?.tryUnwrap()
    : undefined;
}

// ----- Signatory Record -----

export function useWalletSignatoryRecord(proposal: PublicKey) {
  const { wallet, programId } = useRpcContext();

  return useGovernanceAccountByPda<SignatoryRecord>(
    SignatoryRecord,
    async () => {
      if (!proposal || !wallet?.publicKey) {
        return;
      }

      return await getSignatoryRecordAddress(
        programId,
        proposal,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, proposal],
  )?.tryUnwrap();
}

export function useSignatoriesByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<SignatoryRecord>(SignatoryRecord, [
    pubkeyFilter(1, proposal),
  ]);
}

// ----- Proposal Instruction -----

export function useInstructionsByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<ProposalInstruction>(
    ProposalInstruction,
    [pubkeyFilter(1, proposal)],
  );
}

// ----- VoteRecord -----

export const useVoteRecordsByProposal = (proposal: PublicKey | undefined) => {
  return useGovernanceAccountsByFilter<VoteRecord>(VoteRecord, [
    pubkeyFilter(1, proposal),
  ]);
};

export const useTokenOwnerVoteRecord = (
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey | undefined,
) => {
  const { programId } = useRpcContext();

  return useGovernanceAccountByPda<VoteRecord>(
    VoteRecord,
    async () => {
      if (!proposal || !tokenOwnerRecord) {
        return;
      }

      return await getVoteRecordAddress(programId, proposal, tokenOwnerRecord);
    },
    [tokenOwnerRecord, proposal],
  );
};
