import { ParsedAccount } from '@oyster/common';
import { Reserve } from '../../../models';

export interface Token {
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface Position {
  id?: number | null;
  leverage: number;
  collateral: {
    type?: ParsedAccount<Reserve>;
    value?: number | null;
  };
  asset: {
    type?: ParsedAccount<Reserve>;
    value?: number | null;
  };
  error?: string;
}
