import {
  getTokenName,
  getVerboseTokenName,
  KnownTokenMap,
} from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';

export const getAssetName = (
  parsedAssetAddress: string,
  assetChain: number,
  solanaTokens: KnownTokenMap,
  ethTokens: KnownTokenMap,
) => {
  if (assetChain === ASSET_CHAIN.Solana)
    return getVerboseTokenName(solanaTokens, parsedAssetAddress);
  else return getVerboseTokenName(ethTokens, `0x${parsedAssetAddress}`);
};

export const getAssetTokenSymbol = (
  parsedAssetAddress: string,
  assetChain: number,
  solanaTokens: KnownTokenMap,
  ethTokens: KnownTokenMap,
) => {
  if (assetChain === ASSET_CHAIN.Solana)
    return getTokenName(solanaTokens, parsedAssetAddress);
  else return getTokenName(ethTokens, `0x${parsedAssetAddress}`);
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

const CHAIN_NAME = {
  [ASSET_CHAIN.Solana]: 'Solana',
  [ASSET_CHAIN.Ethereum]: 'Ethereum',
};

export const chainToName = (chain?: ASSET_CHAIN) => {
  return CHAIN_NAME[chain || ASSET_CHAIN.Ethereum];
};

export const filterModalSolTokens = (tokens: TokenInfo[]) => {
  return tokens;
};
