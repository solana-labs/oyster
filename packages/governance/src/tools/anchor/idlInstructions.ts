import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Layout, rustEnum, struct } from '@project-serum/borsh';

// From https://github.com/project-serum/multisig-ui/blob/2d76e541faabe748f5166e2ec111462ac395c76e/src/utils/idl.ts#L5

// Simplified since we only use the SetBuffer variant.
export type IdlInstruction =
  | Create
  | CreateBuffer
  | Write
  | SetBuffer
  | SetAuthority;

type Create = {};
type CreateBuffer = {};
type Write = {};
type SetBuffer = {};
type SetAuthority = {};

const IDL_INSTRUCTION_LAYOUT: Layout<IdlInstruction> = rustEnum([
  struct([], 'create'),
  struct([], 'createBuffer'),
  struct([], 'write'),
  struct([], 'setBuffer'),
  struct([], 'setAuthority'),
]);

export function encodeInstruction(i: IdlInstruction): Buffer {
  const buffer = Buffer.alloc(1000); // TODO: use a tighter buffer.
  const len = IDL_INSTRUCTION_LAYOUT.encode(i, buffer);
  return Buffer.concat([IDL_TAG, buffer.slice(0, len)]);
}

// Reverse for little endian.
export const IDL_TAG = Buffer.from('0a69e9a778bcf440', 'hex').reverse();

// From https://github.com/project-serum/anchor/blob/2f780e0d274f47e442b3f0d107db805a41c6def0/ts/src/idl.ts#L121

// Deterministic IDL address as a function of the program id.
export async function idlAddress(programId: PublicKey): Promise<PublicKey> {
  const base = (await PublicKey.findProgramAddress([], programId))[0];
  return await PublicKey.createWithSeed(base, seed(), programId);
}

// Seed for generating the idlAddress.
export function seed(): string {
  return 'anchor:idl';
}

// Based on https://github.com/project-serum/multisig-ui/blob/2d76e541faabe748f5166e2ec111462ac395c76e/src/components/Multisig.tsx#L1089
export async function createSetBuffer(
  programId: PublicKey,
  buffer: PublicKey,
  idlAccount: PublicKey,
  idlAuthority: PublicKey,
) {
  const data = encodeInstruction({ setBuffer: {} });

  const keys = [
    {
      pubkey: buffer,
      isWritable: true,
      isSigner: false,
    },
    { pubkey: idlAccount, isWritable: true, isSigner: false },
    { pubkey: idlAuthority, isWritable: false, isSigner: true },
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
