import { SignerWalletAdapter } from '@solana/wallet-adapter-base';

export type WalletSigner = Pick<
  SignerWalletAdapter,
  'publicKey' | 'signTransaction' | 'signAllTransactions'
>;
