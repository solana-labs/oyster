import { ParsedAccount } from '../../../contexts/accounts';
import { LendingReserve } from '../../../models/lending/reserve';

export interface Token {
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface Position {
  id?: number | null;
  leverage: number;
  collateral?: ParsedAccount<LendingReserve>;
  asset: {
    type?: ParsedAccount<LendingReserve>;
    value: string; // because NumericInput returns strings and I dont want to deal with fixing it right now
  };
  error?: string;
}
