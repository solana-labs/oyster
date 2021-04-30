import { PublicKey } from '@solana/web3.js';
import { AssetMeta } from './meta';

export const bridgeAuthorityKey = async (bridgeId: PublicKey) => {
  // @ts-ignore
  return (
    await PublicKey.findProgramAddress([Buffer.from('bridge')], bridgeId)
  )[0];
};
export const wrappedAssetMintKey = async (
  bridgeId: PublicKey,
  authority: PublicKey,
  asset: AssetMeta,
) => {
  if (asset.chain === 1) {
    return new PublicKey(asset.address);
  }

  let seeds: Array<Buffer> = [
    Buffer.from('wrapped'),
    authority.toBuffer(),
    Buffer.of(asset.chain),
    Buffer.of(asset.decimals),
    padBuffer(asset.address, 32),
  ];
  // @ts-ignore
  return (await PublicKey.findProgramAddress(seeds, bridgeId))[0];
};

export const wrappedAssetMetaKey = async (
  bridgeId: PublicKey,
  authority: PublicKey,
  mint: PublicKey,
) => {
  let seeds: Array<Buffer> = [
    Buffer.from('meta'),
    authority.toBuffer(),
    mint.toBuffer(),
  ];
  // @ts-ignore
  return (await PublicKey.findProgramAddress(seeds, bridgeId))[0];
};

export function padBuffer(b: Buffer, len: number): Buffer {
  const zeroPad = Buffer.alloc(len);
  b.copy(zeroPad, len - b.length);
  return zeroPad;
}
