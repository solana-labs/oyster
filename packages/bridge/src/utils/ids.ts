import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export const WORMHOLE_PROGRAM_ID = new PublicKey(
  'WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC',
);

export const TRANSFER_ASSETS_OUT_INSTRUCTION: number = 1;
export const POSTVAA_INSTRUCTION: number = 2;

const INSTRUCTION_LOOKUP: { [key: number]: string } = {
  0: 'Initialize Bridge',
  [TRANSFER_ASSETS_OUT_INSTRUCTION]: 'Transfer Assets Out',
  [POSTVAA_INSTRUCTION]: 'Post VAA',
  3: 'Evict Transfer Proposal',
  4: 'Evict Claimed VAA',
  5: 'Poke Proposal',
  6: 'Verify Signatures',
  7: 'Create Wrapped Asset',
};

export function isWormholeInstruction(
  instruction: TransactionInstruction,
): boolean {
  return WORMHOLE_PROGRAM_ID.toBase58() === instruction.programId.toBase58();
}

export function parsWormholeInstructionTitle(
  instruction: TransactionInstruction,
): string {
  const code = instruction.data[0];

  if (!(code in INSTRUCTION_LOOKUP)) {
    throw new Error(`Unrecognized Wormhole instruction code: ${code}`);
  }

  return INSTRUCTION_LOOKUP[code];
}
