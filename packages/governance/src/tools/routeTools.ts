import { PublicKey } from '@solana/web3.js';

export function getRealmUrl(
  realm: PublicKey | string,
  programId: PublicKey | string,
) {
  return getItemUrl('realm', realm, programId);
}

export function getProposalUrl(
  proposal: PublicKey | string,
  programId: PublicKey | string,
) {
  return getItemUrl('proposal', proposal, programId);
}

export function getGovernanceUrl(
  governance: PublicKey | string,
  programId: PublicKey | string,
) {
  return getItemUrl('governance', governance, programId);
}

export function getItemUrl(
  itemName: string,
  itemId: PublicKey | string,
  programId: PublicKey | string,
) {
  return `/${itemName}/${
    itemId instanceof PublicKey ? itemId.toBase58() : itemId
  }?programId=${
    programId instanceof PublicKey ? programId.toBase58() : programId
  }`;
}
