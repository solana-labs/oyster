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
import { useConnectionConfig, useWallet, ENV } from '@oyster/common';
import { TokenList, TokenInfo } from '@uniswap/token-lists';
import { ethers } from 'ethers';

export interface EthereumContextState {
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  tokens: TokenInfo[];
  tokenMap: Map<string, TokenInfo>;
  accounts: string[];
  connected: boolean;
  chainId: number;
  onConnectEthereum?: () => void;
}

export const EthereumContext = createContext<EthereumContextState>({
  tokens: [],
  tokenMap: new Map<string, TokenInfo>(),
  accounts: [''],
  chainId: 0,
  connected: false,
});

export const EthereumProvider: FunctionComponent = ({ children }) => {
  const [accounts, setAccounts] = useState<string[]>(['']);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number>(0);
  //const { env } = useConnectionConfig();
  const { connected: walletConnected } = useWallet();
  //const wallet = useEthereumWallet();
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
        fetch(
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/tokenlist.json',
        )
          .then(_ => _.json())
          .catch(_ => ({ tokens: [] })),
        fetch('https://tokenlist.aave.eth.link/')
          .then(_ => _.json())
          .catch(() => ({ tokens: [] })),
        fetch('https://tokens.coingecko.com/uniswap/all.json')
          .then(_ => _.json())
          .catch(() => ({ tokens: [] })),
      ]);

      listResponse.forEach((list, i) =>
        list.tokens.reduce((acc, val) => {
          const address = val.address.toLowerCase();
          const current = acc.get(address);
          const extraTag = i === 2 && !current ? 'longList' : '';

          const item = {
            ...val,
            logoURI:
              current?.logoURI ||
              (val.logoURI
                ? val.logoURI?.replace(
                    'ipfs://',
                    'https://cloudflare-ipfs.com/ipfs/',
                  )
                : ` https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${val.address}/logo.png`),
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

  const onConnectEthereum = () => {
    // @ts-ignore
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(() => {
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum,
      );
      const signer = provider.getSigner();
      signer.getAddress().then(account => {
        setAccounts([account]);
        setConnected(true);
      });
      provider.getNetwork().then(network => {
        setChainId(network.chainId);
      });
      setProvider(provider);
    });
  };

  useEffect(() => {
    if (connected) {
      // @ts-ignore
      window.ethereum.on('disconnect', error => {
        setConnected(false);
      });
      // @ts-ignore
      window.ethereum.on('accountsChanged', accounts => {
        if (!accounts || !accounts[0]) setConnected(false);
      });
      // @ts-ignore
      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });
    }
  }, [connected]);

  useEffect(() => {
    if (walletConnected && !connected) {
      onConnectEthereum();
    }
  }, [walletConnected]);

  return (
    <EthereumContext.Provider
      value={{
        tokens: tokens.list,
        tokenMap: tokens.map,
        accounts,
        provider,
        connected,
        chainId,
        onConnectEthereum: () => onConnectEthereum(),
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
};

export const useEthereum = () => {
  const context = useContext(EthereumContext);
  return context;
};
