import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@oyster/common';
import {
  getNativeTreasuryAddress,
  getRealmConfigAddress,
  getSignatoryRecordAddress,
  getTokenOwnerRecordAddress,
  getVoteRecordAddress,
  Governance,
  ProgramAccount,
  Proposal,
  ProposalTransaction,
  Realm,
  RealmConfigAccount,
  SignatoryRecord,
  TokenOwnerRecord,
  VoteRecord,
  pubkeyFilter,
} from '@solana/spl-governance';
import {
  useAccountByPda,
  useGovernanceAccountByPda,
  useGovernanceAccountByPubkey,
  useGovernanceAccountsByFilter,
} from './accountHooks';
import { useRpcContext } from './useRpcContext';
import {
  getVoterWeightProgramAccount,
  AccountVoterWeightRecord,
} from './governance-sdk';

// ----- Realm Config ---------

export function useRealmConfig(realm: PublicKey | undefined) {
  const { programId } = useRpcContext();

  return useGovernanceAccountByPda<RealmConfigAccount>(
    RealmConfigAccount,
    async () => {
      if (!realm) {
        return;
      }
      return await getRealmConfigAddress(programId, realm);
    },
    [realm],
  )?.tryUnwrap();
}

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

      return await getTokenOwnerRecordAddress(
        programId,
        realm,
        governingTokenMint,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, governingTokenMint, realm],
  )?.tryUnwrap();
}

export function useTokenOwnerRecordByOwner(ownerPk: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, ownerPk),
  ]);
}

/// Returns all TokenOwnerRecords for the current wallet
export function useWalletTokenOwnerRecords() {
  const { publicKey } = useWallet();

  return useGovernanceAccountsByFilter<TokenOwnerRecord>(TokenOwnerRecord, [
    pubkeyFilter(1 + 32 + 32, publicKey),
  ]);
}

export function useProposalAuthority(proposalOwner: PublicKey | undefined) {
  const { publicKey, connected } = useWallet();
  const tokenOwnerRecord = useTokenOwnerRecord(proposalOwner);

  return connected &&
    tokenOwnerRecord?.isSome() &&
    (tokenOwnerRecord.value.account.governingTokenOwner.toBase58() ===
      publicKey?.toBase58() ||
      tokenOwnerRecord.value.account.governanceDelegate?.toBase58() ===
        publicKey?.toBase58())
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
  return useGovernanceAccountsByFilter<ProposalTransaction>(
    ProposalTransaction,
    [pubkeyFilter(1, proposal)],
  );
}

// ----- VoterWeightRecord -----
export function useVoterWeightRecord(
  realm?: ProgramAccount<Realm>,
  governance?: ProgramAccount<Governance>,
) {
  const connection = useConnection();
  const { wallet } = useRpcContext();
  const realmConfig = useRealmConfig(governance?.account.realm);
  const programId = realmConfig?.account.communityVoterWeightAddin;
  const isVoterWeightAddin = realm?.account.config.useCommunityVoterWeightAddin;
  const [result, setResult] = useState<AccountVoterWeightRecord | undefined>();

  useEffect(() => {
    async function main() {
      if (
        !programId ||
        !connection ||
        !realm ||
        !isVoterWeightAddin ||
        !wallet.publicKey
      )
        return;

      const account = await getVoterWeightProgramAccount(
        realm,
        connection,
        programId,
        wallet.publicKey,
      );
      setResult(account);
    }
    main();
  }, [connection, realm, realmConfig, programId, isVoterWeightAddin, wallet]);

  return result;
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

export function useNativeTreasury(governance: PublicKey | undefined) {
  const { programId } = useRpcContext();

  return useAccountByPda(async () => {
    if (!governance) {
      return;
    }
    return await getNativeTreasuryAddress(programId, governance);
  }, [governance])?.tryUnwrap();
}
