import { WalletAdapter } from '@solana/wallet-base';

import Wallet from '@project-serum/sol-wallet-adapter';
import { Button, Modal } from 'antd';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { notify } from './../utils/notifications';
import { useConnectionConfig } from './connection';
import { useLocalStorageState } from '../utils/utils';
import { SolongWalletAdapter } from '../wallet-adapters/solong';
import { PhantomWalletAdapter } from '../wallet-adapters/phantom';
import { TorusWalletAdapter } from '../wallet-adapters/torus';
import { useLocation } from 'react-router';
import { LedgerWalletAdapter } from '@solana/wallet-ledger';
import { MathWalletAdapter } from '../wallet-adapters/mathWallet';
import { AldrinWalletAdapter } from '../wallet-adapters/aldrin/AldrinWalletAdapter';

const ASSETS_URL =
  'https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/';
export const WALLET_PROVIDERS = [
  {
    name: 'Aldrin',
    url: 'https://wallet.aldrin.com',
    icon: 'https://aldrin.com/logo.png',
    adapter: AldrinWalletAdapter,
  },
  {
    name: 'Phantom',
    url: 'https://www.phantom.app',
    icon: `https://www.phantom.app/img/logo.png`,
    adapter: PhantomWalletAdapter,
  },
  {
    name: 'Ledger',
    url: 'https://www.ledger.com',
    icon: `${ASSETS_URL}ledger.svg`,
    adapter: LedgerWalletAdapter,
  },
  {
    name: 'Sollet',
    url: 'https://www.sollet.io',
    icon: `${ASSETS_URL}sollet.svg`,
  },
  {
    name: 'Solong',
    url: 'https://solongwallet.com',
    icon: `${ASSETS_URL}solong.png`,
    adapter: SolongWalletAdapter,
  },
  // TODO: enable when fully functional
  {
    name: 'MathWallet',
    url: 'https://mathwallet.org',
    icon: `${ASSETS_URL}mathwallet.svg`,
    adapter: MathWalletAdapter,
  },
  // {
  //   name: 'Torus',
  //   url: 'https://tor.us',
  //   icon: `${ASSETS_URL}torus.svg`,
  //   adapter: TorusWalletAdapter,
  // }

  // Solflare doesnt allow external connections for all apps
  // {
  //   name: "Solflare",
  //   url: "https://solflare.com/access-wallet",
  //   icon: `${ASSETS_URL}solflare.svg`,
  // },
];

const WalletContext = React.createContext<{
  wallet: WalletAdapter | undefined;
  connected: boolean;
  select: () => void;
  provider: typeof WALLET_PROVIDERS[number] | undefined;
}>({
  wallet: undefined,
  connected: false,
  select() {},
  provider: undefined,
});

export function WalletProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();
  const location = useLocation();
  const [autoConnect, setAutoConnect] = useState(
    location.pathname.indexOf('result=') >= 0 || false,
  );
  const [providerUrl, setProviderUrl] = useLocalStorageState('walletProvider');

  const provider = useMemo(
    () => WALLET_PROVIDERS.find(({ url }) => url === providerUrl),
    [providerUrl],
  );

  const wallet = useMemo(
    function () {
      if (provider) {
        try {
          return new (provider.adapter || Wallet)(
            providerUrl,
            endpoint,
          ) as WalletAdapter;
        } catch (e) {
          console.log(`Error connecting to wallet ${provider.name}: ${e}`);
          return undefined;
        }
      }
    },
    [provider, providerUrl, endpoint],
  );

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (wallet) {
      wallet.on('connect', () => {
        if (wallet.publicKey) {
          setConnected(true);
          const walletPublicKey = wallet.publicKey.toBase58();
          const keyToDisplay =
            walletPublicKey.length > 20
              ? `${walletPublicKey.substring(
                  0,
                  7,
                )}.....${walletPublicKey.substring(
                  walletPublicKey.length - 7,
                  walletPublicKey.length,
                )}`
              : walletPublicKey;

          notify({
            message: 'Wallet update',
            description: 'Connected to wallet ' + keyToDisplay,
          });
        }
      });

      wallet.on('disconnect', () => {
        setConnected(false);
        // setProviderUrl(null)
        notify({
          message: 'Wallet update',
          description: 'Disconnected from wallet',
        });
      });
    }

    return () => {
      setConnected(false);
      // setProviderUrl(null)
      if (wallet) {
        wallet.disconnect();
      }
    };
  }, [wallet]);

  useEffect(() => {
    if (wallet && autoConnect) {
      wallet.connect();
      setAutoConnect(false);
    }

    return () => {};
  }, [wallet, autoConnect]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const select = useCallback(() => setIsModalVisible(true), []);
  const close = useCallback(() => setIsModalVisible(false), []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        select,
        provider,
      }}
    >
      {children}
      <Modal
        title="Select Wallet"
        okText="Connect"
        visible={isModalVisible}
        okButtonProps={{ style: { display: 'none' } }}
        onCancel={close}
        width={400}
      >
        {WALLET_PROVIDERS.map((provider, idx) => {
          const onClick = function () {
            setProviderUrl(provider.url);
            setAutoConnect(true);
            close();
          };

          return (
            <Button
              key={idx}
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
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const { wallet, connected, provider, select } = useContext(WalletContext);
  return {
    wallet,
    connected,
    provider,
    select,
    connect() {
      wallet ? wallet.connect() : select();
    },
    disconnect() {
      wallet?.disconnect();
    },
  };
};
