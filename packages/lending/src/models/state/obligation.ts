import { AccountInfo, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';
import { LastUpdate } from './lastUpdate';

// @FIXME: obligation packing
export const ObligationLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('version'),
    /// Amount of collateral tokens deposited for this obligation
    Layout.uint64('collateral.depositedAmount'),
    /// Reserve which collateral tokens were deposited into
    Layout.publicKey('depositReserve'),
    /// Borrow rate used for calculating interest.
    Layout.uint128('cumulativeBorrowRateWads'),
    /// Amount of tokens borrowed for this obligation plus interest
    Layout.uint128('borrowedAmountWads'),
    /// Reserve which tokens were borrowed from
    Layout.publicKey('borrowReserve'),

    // extra space for future contract changes
    BufferLayout.blob(128, 'padding'),
  ],
);

export const isObligation = (info: AccountInfo<Buffer>) => {
  return info.data.length === ObligationLayout.span;
};

export interface Obligation {
  version: number;
  lastUpdate: LastUpdate;
  lendingMarket: PublicKey;
  owner: PublicKey;
  // @FIXME: check usages
  deposits: ObligationCollateral[];
  // @FIXME: check usages
  borrows: ObligationLiquidity[];
  depositedValue: BN; // decimals
  borrowedValue: BN; // decimals
  loanToValueRatio: BN; // decimals
  liquidationThreshold: BN; // decimals
}

export interface ObligationCollateral {
  depositReserve: PublicKey;
  depositedAmount: BN;
  marketValue: BN; // decimals
}

export interface ObligationLiquidity {
  borrowReserve: PublicKey;
  cumulativeBorrowRateWads: BN; // decimals
  borrowedAmountWads: BN; // decimals
  marketValue: BN; // decimals
}

export const ObligationParser = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>,
) => {
  const buffer = Buffer.from(info.data);
  const obligation = ObligationLayout.decode(buffer) as Obligation;

  if (obligation.lastUpdate.slot.isZero()) {
    return;
  }

  const details = {
    pubkey,
    account: {
      ...info,
    },
    info: obligation,
  };

  return details;
};

// @TODO: implement
export const healthFactorToRiskColor = (health: number) => {
  return '';
};
