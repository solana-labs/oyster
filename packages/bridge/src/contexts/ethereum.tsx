import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
// @ts-ignore
import { useWallet as useEthereumWallet } from 'use-wallet';

// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider';
// @ts-ignore
import Fortmatic from 'fortmatic';
import { useWallet, useLocalStorageState, WalletAdapter } from '@oyster/common';
import { TokenList, TokenInfo } from '@uniswap/token-lists';
import { ethers } from 'ethers';
import { MetamaskWalletAdapter } from '../wallet-adapters/metamask';
import { Button, Modal } from 'antd';
import {WalletConnectWalletAdapter} from "../wallet-adapters/wallet-connect";

const ASSETS_URL =
  'https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/';
export const ETH_WALLET_PROVIDERS = [
  {
    name: 'Metamask',
    url: 'https://www.metamask.com',
    icon: `${ASSETS_URL}metamask.svg`,
    adapter: MetamaskWalletAdapter,
  },
  {
    name: 'Wallect Connect',
    url: 'https://walletconnect.org/',
    icon: `${ASSETS_URL}walletconnect.svg`,
    adapter: WalletConnectWalletAdapter,
  },
];

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

  const [providerUrl, setProviderUrl] = useLocalStorageState(
    'ethWalletProvider',
  );
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number>(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { connected: walletConnected } = useWallet();

  const [tokens, setTokens] = useState<{
    map: Map<string, TokenInfo>;
    list: TokenInfo[];
  }>({
    map: new Map<string, TokenInfo>(),
    list: [],
  });
  const walletProvider = useMemo(
    () => ETH_WALLET_PROVIDERS.find(({ url }) => url === providerUrl),
    [providerUrl],
  );
  const wallet = useMemo(
    function () {
      if (walletProvider) {
        return new walletProvider.adapter() as WalletAdapter;
      }
    },
    [walletProvider, providerUrl],
  );

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

  const onConnectEthereum = useCallback(() => {
    if (wallet && providerUrl) {
      wallet.connect();
    } else {
      select();
    }
  }, [wallet, providerUrl]);

  useEffect(() => {
    if (wallet) {
      wallet.on('connect', () => {
        // @ts-ignore
        setAccounts(wallet.accounts);
        // @ts-ignore
        setChainId(wallet.chainID);
        // @ts-ignore
        setProvider(wallet.provider);
        setConnected(true);
      });
      wallet.on('disconnect', error => {
        setConnected(false);
      });
      // @ts-ignore
      wallet.on('accountsChanged', accounts => {
        if (!accounts || !accounts[0]) setConnected(false);
      });
      // @ts-ignore
      wallet.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });
    }
    return () => {
      setConnected(false);
      if (wallet) {
        wallet.disconnect();
      }
    };
  }, [wallet]);

  const select = useCallback(() => setIsModalVisible(true), []);
  const close = useCallback(() => setIsModalVisible(false), []);

  useEffect(() => {
    if (walletConnected && !connected) {
      onConnectEthereum();
    }
  }, [walletConnected, connected]);

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
      <Modal
        title="Select Ethereum Wallet"
        okText="Connect"
        visible={isModalVisible}
        okButtonProps={{ style: { display: 'none' } }}
        onCancel={close}
        width={400}
      >
        {ETH_WALLET_PROVIDERS.map(provider => {
          const onClick = function () {
            setProviderUrl(provider.url);
            close();
          };

          return (
            <Button
              size="large"
              type={providerUrl === provider.url ? 'primary' : 'ghost'}
              onClick={onClick}
              icon={
                <img
                  alt={`${provider.name}`}
                  width={20}
                  height={20}
                  src={provider.icon}
                  style={{ marginRight: 8 }}
                />
              }
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 8,
              }}
            >
              {provider.name}
            </Button>
          );
        })}
      </Modal>
    </EthereumContext.Provider>
  );
};

export const useEthereum = () => {
  const context = useContext(EthereumContext);
  return context;
};
