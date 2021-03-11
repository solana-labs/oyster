import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';
import { ASSET_CHAIN } from '../constants';

export interface ProgressUpdate {
  message: string;
  type: string;
  step: number;
  group: string;
  replace?: boolean;
}

export interface TransferRequestInfo {
  address: string;
  name: string;
  balance: BigNumber;
  balanceAsNumber: number;
  decimals: number;
  allowance: BigNumber;
  isWrapped: boolean;
  chainID: number;
  assetAddress: Buffer;
  mint: string;
}

export interface TransferRequest {
  // ethereum specific fields, TODO: remove
  nonce?: number;
  signer?: ethers.Signer;
  amountBN?: BigNumber;

  amount?: number;

  info?: TransferRequestInfo;

  from?: ASSET_CHAIN;
  asset?: string;

  toChain?: ASSET_CHAIN;
  recipient?: Buffer;
}
