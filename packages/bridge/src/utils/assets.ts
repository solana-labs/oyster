export const getAssetName = (
  parsedAssetAddress: string,
  assetChain: number,
) => {
  return parsedAssetAddress.slice(0, 5);
};

export const getAssetTokenSymbol = (
  parsedAssetAddress: string,
  assetChain: number,
) => {
  return parsedAssetAddress.slice(0, 5);
};

export const getAssetAmountInUSD = (
  amount: number,
  parsedAssetAddress: string,
  assetChain: number,
) => {
  return amount;
};

export enum ASSET_CHAIN {
  Solana = 1,
  Ethereum = 2,
}
