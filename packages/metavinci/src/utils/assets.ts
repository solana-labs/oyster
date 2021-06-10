import {
  getTokenName,
  getVerboseTokenName,
  KnownTokenMap,
} from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';
import { COINGECKO_COIN_PRICE_API } from '../contexts/coingecko';

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

export const LAMPORT_MULTIPLIER = 10 ** 9;
const WINSTON_MULTIPLIER = 10 ** 12;

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

export const solanaToUSD = async (amount: number): Promise<number> => {
  const url = `${COINGECKO_COIN_PRICE_API}?ids=solana&vs_currencies=usd`
  const resp = await window.fetch(url).then(resp => resp.json())
  return amount * resp.solana.usd
}

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

export async function getAssetCostToStore(files: File[]) {
  const totalBytes = files.reduce((sum, f) => (sum += f.size), 0);
  console.log('Total bytes', totalBytes);
  const txnFeeInWinstons = parseInt(
    await (await fetch('https://arweave.net/price/0')).text(),
  );
  console.log('txn fee', txnFeeInWinstons);
  const byteCostInWinstons = parseInt(
    await (
      await fetch('https://arweave.net/price/' + totalBytes.toString())
    ).text(),
  );
  console.log('byte cost', byteCostInWinstons);
  const totalArCost =
    (txnFeeInWinstons * files.length + byteCostInWinstons) / WINSTON_MULTIPLIER;

  console.log('total ar', totalArCost);
  const conversionRates = JSON.parse(
    await (
      await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana,arweave&vs_currencies=usd',
      )
    ).text(),
  );

  // To figure out how many lamports are required, multiply ar byte cost by this number
  const arMultiplier = conversionRates.arweave.usd / conversionRates.solana.usd;
  console.log('Ar mult', arMultiplier);
  // Add 10% padding for safety and slippage in price.
  // We also always make a manifest file, which, though tiny, needs payment.
  return LAMPORT_MULTIPLIER * totalArCost * arMultiplier * 1.1;
}
