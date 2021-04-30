import { programIds } from '@oyster/common';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import { padBuffer } from './helpers';
import { AssetMeta } from './meta';
import { ASSET_CHAIN } from './constants';

export const createLockAssetInstruction = async (
  authorityKey: PublicKey,
  payer: PublicKey,
  tokenAccount: PublicKey,
  mint: PublicKey,
  amount: BN,
  targetChain: number,
  targetAddress: Buffer,
  asset: AssetMeta,
  nonce: number,
) => {
  const programId = programIds().wormhole.pubkey;
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    // uint256
    BufferLayout.blob(32, 'amount'),
    BufferLayout.u8('targetChain'),
    BufferLayout.blob(32, 'assetAddress'),
    BufferLayout.u8('assetChain'),
    BufferLayout.u8('assetDecimals'),
    BufferLayout.blob(32, 'targetAddress'),
    BufferLayout.seq(BufferLayout.u8(), 1),
    BufferLayout.u32('nonce'),
  ]);

  let nonceBuffer = Buffer.alloc(4);
  nonceBuffer.writeUInt32LE(nonce, 0);

  // @ts-ignore
  let seeds: Array<Buffer> = [
    Buffer.from('transfer'),
    authorityKey.toBuffer(),
    Buffer.from([asset.chain]),
    padBuffer(asset.address, 32),
    Buffer.from([targetChain]),
    padBuffer(targetAddress, 32),
    tokenAccount.toBuffer(),
    nonceBuffer,
  ];
  // @ts-ignore
  let transferKey = (await PublicKey.findProgramAddress(seeds, programId))[0];

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1, // TransferOut instruction
      amount: padBuffer(Buffer.from(amount.toArray()), 32),
      targetChain: targetChain,
      assetAddress: padBuffer(asset.address, 32),
      assetChain: asset.chain,
      assetDecimals: asset.decimals,
      targetAddress: padBuffer(targetAddress, 32),
      nonce: nonce,
    },
    data,
  );

  const keys = [
    { pubkey: programId, isSigner: false, isWritable: false },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: programIds().token, isSigner: false, isWritable: false },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_CLOCK_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: tokenAccount, isSigner: false, isWritable: true },
    { pubkey: authorityKey, isSigner: false, isWritable: false },

    { pubkey: transferKey, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: payer, isSigner: true, isWritable: true },
  ];

  if (asset.chain === ASSET_CHAIN.Solana) {
    // @ts-ignore
    let custodyKey = (
      await PublicKey.findProgramAddress(
        [Buffer.from('custody'), authorityKey.toBuffer(), mint.toBuffer()],
        programId,
      )
    )[0];
    keys.push({ pubkey: custodyKey, isSigner: false, isWritable: true });
  }

  return {
    ix: new TransactionInstruction({
      keys,
      programId: programId,
      data,
    }),
    transferKey: transferKey,
  };
};
