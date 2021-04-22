import BN from 'bn.js';
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
  decimals: number;
  allowance: BigNumber;
  isWrapped: boolean;
  chainID: number;
  assetAddress: Buffer;
  mint: string;
}

export interface TransferRequest {
  amount?: number;

  info?: TransferRequestInfo;

  from?: ASSET_CHAIN;
  asset?: string;

  to?: ASSET_CHAIN;
  recipient?: Buffer;
}

export const displayBalance = (info?: TransferRequestInfo) => {
  try {
    const balance = info?.balance.toNumber() || 0;
    const precision = Math.pow(10, info?.decimals || 0);
    return balance / precision;
  } catch {
    return 0;
  }
};
