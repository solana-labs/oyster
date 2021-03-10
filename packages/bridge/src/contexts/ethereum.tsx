import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
// @ts-ignore
import { useWallet as useEthereumWallet } from 'use-wallet';

// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider';
// @ts-ignore
import Fortmatic from 'fortmatic';
import Torus from '@toruslabs/torus-embed';
import { useConnectionConfig, useWallet, ENV } from '@oyster/common';
import { TokenList, TokenInfo } from '@uniswap/token-lists';
import { ethers } from 'ethers';

export interface EthereumContextState {
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  tokens: TokenInfo[];
  tokenMap: Map<string, TokenInfo>;
  accounts: string[];
}

export const EthereumContext = createContext<EthereumContextState>({
  tokens: [],
  tokenMap: new Map<string, TokenInfo>(),
  accounts: [''],
});

export const EthereumProvider: FunctionComponent = ({ children }) => {
  const [accounts, setAccounts] = useState<string[]>(['']);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const { env } = useConnectionConfig();
  const { connected } = useWallet();
  const wallet = useEthereumWallet();
  const [tokens, setTokens] = useState<{
    map: Map<string, TokenInfo>;
    list: TokenInfo[];
  }>({
    map: new Map<string, TokenInfo>(),
    list: [],
  });

  useEffect(() => {
    (async () => {
      const map = new Map<string, TokenInfo>();
      const listResponse: TokenList[] = await Promise.all([
        fetch('https://gateway.ipfs.io/ipns/tokens.uniswap.org').then(_ =>
          _.json(),
        ),
        fetch('https://tokenlist.aave.eth.link/').then(_ => _.json()),
        fetch('https://tokens.coingecko.com/uniswap/all.json').then(_ =>
          _.json(),
        ),
      ]);

      listResponse.forEach((list, i) =>
        list.tokens.reduce((acc, val) => {
          const address = val.address.toLowerCase();
          const extraTag = i === 2 && !acc.has(address) ? 'longList' : '';

          const item = {
            ...val,
            logoURI: val.logoURI
              ? val.logoURI?.replace(
                  'ipfs://',
                  'https://cloudflare-ipfs.com/ipfs/',
                )
              : ` https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${val.address}/logo.png `,
            tags: val.tags ? [...val.tags, extraTag] : [extraTag],
          };

          acc.set(address, item);
          return acc;
        }, map),
      );

      setTokens({
        map,
        list: [...map.values()],
      });
    })();
  }, [setTokens]);

  useEffect(() => {
    if (connected) {
      // @ts-ignore
      window.ethereum.enable();
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum,
      );
      const signer = provider.getSigner();
      signer.getAddress().then(account => setAccounts([account]));

      setProvider(provider);
    }
  }, [connected]);

  return (
    <EthereumContext.Provider
      value={{ tokens: tokens.list, tokenMap: tokens.map, accounts, provider }}
    >
      {children}
    </EthereumContext.Provider>
  );
};

export const useEthereum = () => {
  const context = useContext(EthereumContext);
  return context;
};
