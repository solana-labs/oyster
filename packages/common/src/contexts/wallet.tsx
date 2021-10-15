import {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapter,
  SignerWalletAdapterProps,
  WalletAdapterNetwork,
  WalletAdapterProps,
  WalletError,
  WalletNotConnectedError,
} from '@solana/wallet-adapter-base';
import {
  useWallet as useWalletBase,
  WalletProvider as BaseWalletProvider
} from '@solana/wallet-adapter-react';
import {
  getLedgerWallet,
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
  getTorusWallet,
  Wallet,
  WalletName,
} from '@solana/wallet-adapter-wallets';
import { Button, Modal } from "antd";
import React, { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notify } from "../utils";
import { useConnectionConfig } from "./connection";

export interface WalletContextState extends WalletAdapterProps {
  wallets: Wallet[];
  autoConnect: boolean;

  wallet: Wallet | null;
  adapter: SignerWalletAdapter | MessageSignerWalletAdapterProps | null;
  disconnecting: boolean;

  select(walletName: WalletName): void;

  signTransaction: SignerWalletAdapterProps['signTransaction'];
  signAllTransactions: SignerWalletAdapterProps['signAllTransactions'];

  signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
}

export function useWallet (): WalletContextState {
  return useWallet() as WalletContextState;
}

export { SignerWalletAdapter, WalletNotConnectedError };

export type WalletSigner = Pick<SignerWalletAdapter, 'publicKey' | 'signTransaction' | 'signAllTransactions'>;

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export const WalletModalContext = createContext<WalletModalContextState>({} as WalletModalContextState);

export function useWalletModal(): WalletModalContextState {
  return useContext(WalletModalContext);
}

export const WalletModal = () => {
  const { wallets, wallet: selected, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const close = useCallback(() => setVisible(false), [setVisible]);

  return (
    <Modal
      title="Select Wallet"
      okText="Connect"
      visible={visible}
      footer={null}
      onCancel={close}
      width={400}
    >
      {wallets.map((wallet) => {
        return (
          <Button
            key={wallet.name}
            size="large"
            type={wallet === selected ? 'primary' : 'ghost'}
            onClick={() => { select(wallet.name); close(); }}
            icon={
              <img
                alt={`${wallet.name}`}
                width={20}
                height={20}
                src={wallet.icon}
                style={{marginRight: 8}}
              />
            }
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              marginBottom: 8,
            }}
          >
            {wallet.name}
          </Button>
        );
      })}
    </Modal>
  );
};

export const WalletModalProvider = ({ children }: { children: ReactNode }) => {
  const { publicKey } = useWallet();
  const [connected, setConnected] = useState(!!publicKey);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (publicKey) {
      const base58 = publicKey.toBase58();
      const keyToDisplay =
        base58.length > 20
          ? `${base58.substring(
            0,
            7,
          )}.....${base58.substring(
            base58.length - 7,
            base58.length,
          )}`
          : base58;

      notify({
        message: 'Wallet update',
        description: 'Connected to wallet ' + keyToDisplay,
      });
    }
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey && connected) {
      notify({
        message: 'Wallet update',
        description: 'Disconnected from wallet',
      });
    }
    setConnected(!!publicKey);
  }, [publicKey, connected, setConnected]);

  return (
    <WalletModalContext.Provider
      value={{
        visible,
        setVisible,
      }}
    >
      {children}
      <WalletModal/>
    </WalletModalContext.Provider>
  );
};

export const WalletProvider = ({ children }: {children: ReactNode }) => {
  const { env } = useConnectionConfig();

  const network = useMemo(() => {
    switch (env) {
      case "mainnet-beta":
      case "mainnet-beta (Serum)":
        return WalletAdapterNetwork.Mainnet;
      case "testnet":
        return WalletAdapterNetwork.Testnet;
      case "devnet":
      case "localnet":
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, [env]);

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSlopeWallet(),
      getSolflareWallet(),
      getTorusWallet({
        options: { clientId: 'Get a client ID @ https://developer.tor.us' }
      }),
      getLedgerWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error(error);
    notify({
      message: 'Wallet error',
      description: error.message,
    });
  }, []);

  return (
    <BaseWalletProvider
      wallets={wallets}
      onError={onError}
      autoConnect
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </BaseWalletProvider>
  );
}
