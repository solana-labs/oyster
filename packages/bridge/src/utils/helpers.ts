import { PublicKey } from '@solana/web3.js';
import { keccak256 } from 'ethers/utils';
import { programIds } from '@oyster/common';

export function deriveERC20Address(key: PublicKey) {
  const ethBridgeAddress = programIds().wormhole.bridge;
  const ethWrappedMaster = programIds().wormhole.wrappedMaster;
  let hashData = '0xff' + ethBridgeAddress.slice(2);
  hashData += keccak256(Buffer.concat([new Buffer([1]), key.toBuffer()])).slice(
    2,
  ); // asset_id
  hashData += keccak256(
    '0x3d602d80600a3d3981f3363d3d373d3d3d363d73' +
      ethWrappedMaster +
      '5af43d82803e903d91602b57fd5bf3',
  ).slice(2); // Bytecode

  return keccak256(hashData).slice(26);
}
