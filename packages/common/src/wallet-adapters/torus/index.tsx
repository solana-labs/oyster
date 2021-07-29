import EventEmitter from 'eventemitter3';
import { Account, PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-base';
import OpenLogin from '@toruslabs/openlogin';
import { getED25519Key } from '@toruslabs/openlogin-ed25519';

const getSolanaPrivateKey = (openloginKey: string) => {
  const { sk } = getED25519Key(openloginKey);
  return sk;
};

export class TorusWalletAdapter extends EventEmitter implements WalletAdapter {
  _provider: OpenLogin | undefined;
  endpoint: string;
  providerUrl: string;
  account: Account | undefined;
  image: string = '';
  name: string = '';

  constructor(providerUrl: string, endpoint: string) {
    super();
    this.connect = this.connect.bind(this);
    this.endpoint = endpoint;
    this.providerUrl = providerUrl;
  }

  async signAllTransactions(
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    if (this.account) {
      let account = this.account;
      transactions.forEach(t => t.partialSign(account));
    }

    return transactions;
  }

  get publicKey() {
    return this.account?.publicKey || null;
  }

  async signTransaction(transaction: Transaction) {
    if (this.account) {
      transaction.partialSign(this.account);
    }

    return transaction;
  }

  connect = async () => {
    const clientId =
      process.env.REACT_APP_CLIENT_ID ||
      'BNxdRWx08cSTPlzMAaShlM62d4f8Tp6racfnCg_gaH0XQ1NfSGo3h5B_IkLtgSnPMhlxsSvhqugWm0x8x-VkUXA';
    this._provider = new OpenLogin({
      clientId,
      network: 'testnet', // mainnet, testnet, development
      uxMode: 'popup',
    });

    try {
      await this._provider.init();
    } catch (ex) {
      console.error('init failed', ex);
    }

    console.error(this._provider?.state.store);

    if (this._provider.privKey) {
      const privateKey = this._provider.privKey;
      const secretKey = getSolanaPrivateKey(privateKey);
      this.account = new Account(secretKey);
    } else {
      try {
        const { privKey } = await this._provider.login({
          loginProvider: 'unselected',
        } as any);
        const secretKey = getSolanaPrivateKey(privKey);
        this.account = new Account(secretKey);
      } catch (ex) {
        console.error('login failed', ex);
      }
    }

    this.name = this._provider?.state.store.get('name');
    this.image = this._provider?.state.store.get('profileImage');
    debugger;

    this.emit('connect');
  };

  disconnect = async () => {
    console.log('Disconnecting...');
    if (this._provider) {
      await this._provider.logout();
      await this._provider._cleanup();
      this._provider = undefined;
      this.emit('disconnect');
    }
  };
}
