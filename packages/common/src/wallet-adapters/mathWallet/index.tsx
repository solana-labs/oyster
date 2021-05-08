import EventEmitter from 'eventemitter3';
import { PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-base';
import { notify } from '../../utils/notifications';

export class MathWalletAdapter extends EventEmitter implements WalletAdapter {
  _publicKey: PublicKey | null;
  _onProcess: boolean;
  _connected: boolean;
  constructor() {
    super();
    this._publicKey = null;
    this._onProcess = false;
    this._connected = false;
    this.connect = this.connect.bind(this);
  }

  get publicKey() {
    return this._publicKey;
  }

  get connected() {
    return this._connected;
  }

  get autoApprove() {
    return false;
  }

  // eslint-disable-next-line
  async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions;
    }

    return this._provider.signAllTransactions(transactions);
  }

  private get _provider() {
    if ((window as any)?.solana?.isMathWallet) {
      return (window as any).solana;
    }
    return undefined;
  }

  signTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction;
    }

    return this._provider.signTransaction(transaction);
  }

  connect() {
    if (this._onProcess) {
      return;
    }
    if (!this._provider) {
      notify({
        message: 'MathWallet Error',
        description:
          'Please install and initialize Math wallet extension from Chrome first',
      });
      return;
    }

    this._onProcess = true;
    this._provider
      .getAccount()
      .then((account: any) => {
        this._publicKey = new PublicKey(account);
        this._connected = true;
        this.emit('connect', this._publicKey);
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
      this._connected = false;
      this.emit('disconnect');
    }
  }
}
