import { PublicKey } from '@solana/web3.js';
import { EventEmitter } from 'eventemitter3';

import {
  getSignatoryRecordAddress,
  getTokenOwnerAddress,
  Governance,
  Proposal,
  ProposalInstruction,
  SignatoryRecord,
  TokenOwnerRecord,
} from '../models/accounts';
import { pubkeyFilter } from '../utils/api';
import {
  useGovernanceAccountByPda,
  useGovernanceAccountByPubkey,
  useGovernanceAccountsByFilter,
} from './accountHooks';

import { useWallet } from '@oyster/common';

class AccountRemovedEvent {
  pubkey: PublicKey;

  constructor(pubkey: PublicKey) {
    this.pubkey = pubkey;
  }
}

class AccountChangeEmitter {
  private emitter = new EventEmitter();

  onAccountRemoved(callback: (args: AccountRemovedEvent) => void) {
    this.emitter.on(AccountRemovedEvent.name, callback);
    return () =>
      this.emitter.removeListener(AccountRemovedEvent.name, callback);
  }

  emitAccountRemoved(pubkey: PublicKey) {
    this.emitter.emit(
      AccountRemovedEvent.name,
      new AccountRemovedEvent(pubkey),
    );
  }
}

export const accountChangeEmitter = new AccountChangeEmitter();

// ----- Governance -----

export function useGovernance(governance: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Governance>(Governance, governance);
}

export function useGovernancesByRealm(realm: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<Governance>(Governance, [
    pubkeyFilter(1, realm),
  ]);
}

// ----- Proposal -----

export function useProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountByPubkey<Proposal>(Proposal, proposal);
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
  const { wallet } = useWallet();

  return useGovernanceAccountByPda<TokenOwnerRecord>(
    TokenOwnerRecord,
    async () => {
      if (!realm || !wallet?.publicKey || !governingTokenMint) {
        return;
      }

      return await getTokenOwnerAddress(
        realm,
        governingTokenMint,
        wallet.publicKey,
      );
    },
    [wallet?.publicKey, governingTokenMint, realm],
  );
}

export function useProposalAuthority(proposalOwner: PublicKey | undefined) {
  const { wallet, connected } = useWallet();
  const tokenOwnerRecord = useTokenOwnerRecord(proposalOwner);

  return connected &&
    tokenOwnerRecord &&
    (tokenOwnerRecord.info.governingTokenOwner.toBase58() ===
      wallet?.publicKey?.toBase58() ||
      tokenOwnerRecord.info.governanceDelegate?.toBase58() ===
        wallet?.publicKey?.toBase58())
    ? tokenOwnerRecord
    : undefined;
}

// ----- Signatory Record -----

export function useWalletSignatoryRecord(proposal: PublicKey) {
  const { wallet } = useWallet();

  return useGovernanceAccountByPda<SignatoryRecord>(
    SignatoryRecord,
    async () => {
      if (!proposal || !wallet?.publicKey) {
        return;
      }

      return await getSignatoryRecordAddress(proposal, wallet.publicKey);
    },
    [wallet?.publicKey, proposal],
  );
}

// ----- Proposal Instruction -----

export function useInstructionsByProposal(proposal: PublicKey | undefined) {
  return useGovernanceAccountsByFilter<ProposalInstruction>(
    ProposalInstruction,
    [pubkeyFilter(1, proposal)],
  );
}
