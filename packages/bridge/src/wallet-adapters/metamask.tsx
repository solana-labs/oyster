import EventEmitter from 'eventemitter3';
import { PublicKey, Transaction } from '@solana/web3.js';
import { notify } from '@oyster/common';
import { WalletAdapter } from '@solana/wallet-base';
import { ethers } from 'ethers';

export class MetamaskWalletAdapter
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
    return (window as any).ethereum.signTransaction(transaction);
  }
  async signAllTransactions(transactions: Transaction[]) {
    return transactions;
  }

  connect() {
    if (this._onProcess) {
      return;
    }

    if ((window as any).ethereum === undefined) {
      notify({
        message: 'Metamask Error',
        description: 'Please install metamask wallet from Chrome ',
      });
      return;
    }

    this._onProcess = true;
    // @ts-ignore
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(() => {
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum,
        );
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
        window.ethereum.on('disconnect', error => {
          this.emit('disconnect', error);
        });
        // @ts-ignore
        window.ethereum.on('accountsChanged', accounts => {
          this.emit('accountsChanged', accounts);
        });
        // @ts-ignore
        window.ethereum.on('chainChanged', (chainId: string) => {
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
    if (this._provider) {
      this._publicKey = null;
      this._provider = null;
      this.emit('disconnect');
    }
  }
}
