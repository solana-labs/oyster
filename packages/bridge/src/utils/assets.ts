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

const EXCLUDED_COMMON_TOKENS = ['usdt', 'usdc'];
const EXCLUDED_SPL_TOKENS = [
  'sol',
  'srm',
  'ray',
  'oxy',
  'mer',
  'maps',
  ...EXCLUDED_COMMON_TOKENS,
];

export const filterModalSolTokens = (tokens: TokenInfo[]) => {
  return tokens.filter(
    token =>
      EXCLUDED_SPL_TOKENS.indexOf(token.symbol.toLowerCase()) < 0 &&
      !token.name.includes('(Sollet)'),
  );
};
const EXCLUDED_ETH_TOKENS = [...EXCLUDED_COMMON_TOKENS];

export const filterModalEthTokens = (tokens: TokenInfo[]) => {
  return tokens.filter(
    token => EXCLUDED_ETH_TOKENS.indexOf(token.symbol.toLowerCase()) < 0,
  );
};

export const RIN_SOLANA_MINT = 'E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp';
export const WWT_RIN_ETHEREUM_MINT =
  '0x07ca256267128fbe1a79b74fc7b0e6ed3359ad08';
