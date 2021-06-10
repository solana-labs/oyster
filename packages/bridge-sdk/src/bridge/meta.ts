import { programIds } from '@oyster/common';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
import { padBuffer, wrappedAssetMetaKey } from './helpers';

export interface AssetMeta {
  chain: number;
  decimals: number;
  address: Buffer;
}

export const WrappedMetaLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('chain'),
    BufferLayout.blob(32, 'address'),
    BufferLayout.u8('isInitialized'),
  ],
);

export const createWrappedLayout = BufferLayout.struct([
  BufferLayout.u8('instruction'),
  BufferLayout.blob(32, 'assetAddress'),
  BufferLayout.u8('chain'),
  BufferLayout.u8('decimals'),
]);

export const createWrappedAssetInstruction = async (
  meta: AssetMeta,
  bridgeId: PublicKey,
  authorityKey: PublicKey,
  mintKey: PublicKey,
  payer: PublicKey,
) => {
  let metaKey = await wrappedAssetMetaKey(bridgeId, authorityKey, mintKey);
  const wa_keys = [
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: programIds().token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: authorityKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: metaKey,
      isSigner: false,
      isWritable: true,
    },
  ];

  const wrappedData = Buffer.alloc(createWrappedLayout.span);
  createWrappedLayout.encode(
    {
      instruction: 7, // CreateWrapped instruction
      assetAddress: padBuffer(meta.address, 32),
      chain: meta.chain,
      decimals: meta.decimals,
    },
    wrappedData,
  );

  return new TransactionInstruction({
    keys: wa_keys,
    programId: bridgeId,
    data: wrappedData,
  });
};
