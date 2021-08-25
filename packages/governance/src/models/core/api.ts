import { Connection, PublicKey } from '@solana/web3.js';
import { WalletNotConnectedError } from '../errors';

export interface IWallet {
  publicKey: PublicKey;
}

// Context to make RPC calls for given clone programId, current connection, endpoint and wallet
export class RpcContext {
  programId: PublicKey;
  wallet: IWallet | undefined;
  connection: Connection;
  endpoint: string;

  constructor(
    programId: PublicKey,
    wallet: IWallet | undefined,
    connection: Connection,
    endpoint: string,
  ) {
    this.programId = programId;
    this.wallet = wallet;
    this.connection = connection;
    this.endpoint = endpoint;
  }

  get walletPubkey() {
    if (!this.wallet?.publicKey) {
      throw new WalletNotConnectedError();
    }

    return this.wallet.publicKey;
  }

  get programIdBase58() {
    return this.programId.toBase58();
  }
}

export class MemcmpFilter {
  offset: number;
  bytes: Buffer;

  constructor(offset: number, bytes: Buffer) {
    this.offset = offset;
    this.bytes = bytes;
  }

  isMatch(buffer: Buffer) {
    if (this.offset + this.bytes.length > buffer.length) {
      return false;
    }

    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] !== buffer[this.offset + i]) return false;
    }

    return true;
  }
}

export const pubkeyFilter = (
  offset: number,
  pubkey: PublicKey | undefined | null,
) => (!pubkey ? undefined : new MemcmpFilter(offset, pubkey.toBuffer()));
