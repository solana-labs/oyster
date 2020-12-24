export interface Token {
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface Position {
  id?: number | null;
  leverage: number;
  collateral?: Token;
  asset: {
    type?: Token;
    value: number;
  };
}
