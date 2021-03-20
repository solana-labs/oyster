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
    return (
      new BN(info?.balance?.toString() || 0)
        .div(new BN(10).pow(new BN(Math.min((info?.decimals || 0) - 2, 0))))
        .toNumber() / 100
    );
  } catch {
    return 0;
  }
};
