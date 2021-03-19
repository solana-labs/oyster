import EventEmitter from 'eventemitter3';
import { PublicKey, Transaction } from '@solana/web3.js';
import { notify } from '@oyster/common';
import { WalletAdapter } from '@solana/wallet-base'
import { ethers } from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";

export class WalletConnectWalletAdapter
  extends EventEmitter
  implements WalletAdapter {
  _publicKey: PublicKey | null;
  _onProcess: boolean;
  _accounts: Array<any>;
  _chainID: number;
  _provider: any;

  constructor() {
    super();
    this._publicKey = null;
    this._provider = null;
    this._accounts = [];
    this._chainID = 0;
    this._onProcess = false;
    this.connect = this.connect.bind(this);
  }

  get publicKey() {
    return this._publicKey;
  }
  get provider() {
    return this._provider;
  }
  get accounts() {
    return this._accounts;
  }
  get chainID() {
    return this._chainID;
  }

  async signTransaction(transaction: Transaction) {
    return this._provider.signTransaction(transaction);
  }
  async signMultipleTransaction(transactions: Transaction[]) {
    return transactions;
  }

  connect() {
    if (this._onProcess) {
      return;
    }

    this._onProcess = true;

    //  Create WalletConnect Provider
    const walletConnectProvider = new WalletConnectProvider({
      infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
    });
    walletConnectProvider.enable().then(()=>{
      const provider = new ethers.providers.Web3Provider(walletConnectProvider);
      const signer = provider.getSigner();
      signer.getAddress().then(account => {
        this._accounts = [account];
        provider.getNetwork().then(network => {
          this._chainID = network.chainId;
          this._provider = provider;
          this.emit('connect');
        });
      });
      // @ts-ignore
      walletConnectProvider.on('disconnect', (code: number, reason: string) => {
        this.emit('disconnect', {code, reason});
      });
      // @ts-ignore
      walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
        this.emit('accountsChanged', accounts);
      });
      // @ts-ignore
      walletConnectProvider.on('chainChanged', (chainId: number) => {
        this.emit('chainChanged', chainId);
      });
    })
    .catch(() => {
      this.disconnect();
    })
    .finally(() => {
      this._onProcess = false;
    });

  }

  disconnect() {
    if (this._publicKey) {
      this._publicKey = null;
      this.emit('disconnect');
    }
  }
}
