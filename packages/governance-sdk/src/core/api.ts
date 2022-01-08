import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { ProgramAccountWithType } from 'core/accounts';
import { Schema } from 'borsh';
import { getErrorMessage } from 'tools/script';
import { ProgramAccount } from 'tools/solanaSdk';
import { deserializeBorsh } from 'tools/borsh';
import { WalletSigner } from 'tools/walletAdapter';

// Context to make RPC calls for given clone programId, current connection, endpoint and wallet
export class RpcContext {
  programId: PublicKey;
  programVersion: number;
  wallet: WalletSigner;
  connection: Connection;
  endpoint: string;

  constructor(
    programId: PublicKey,
    programVersion: number,
    wallet: WalletSigner,
    connection: Connection,
    endpoint: string,
  ) {
    this.programId = programId;
    this.wallet = wallet;
    this.connection = connection;
    this.endpoint = endpoint;
    this.programVersion = programVersion;
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

export async function getBorshProgramAccounts<
  TAccount extends ProgramAccountWithType
>(
  programId: PublicKey,
  getSchema: (accountType: number) => Schema,
  endpoint: string,
  accountFactory: new (args: any) => TAccount,
  filters: MemcmpFilter[] = [],
  accountType?: number,
) {
  accountType = accountType ?? new accountFactory({}).accountType;

  let getProgramAccounts = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getProgramAccounts',
      params: [
        programId.toBase58(),
        {
          commitment: 'recent',
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: bs58.encode([accountType]),
              },
            },
            ...filters.map(f => ({
              memcmp: { offset: f.offset, bytes: bs58.encode(f.bytes) },
            })),
          ],
        },
      ],
    }),
  });
  const rawAccounts = (await getProgramAccounts.json())['result'];
  let accounts: { [pubKey: string]: ProgramAccount<TAccount> } = {};

  for (let rawAccount of rawAccounts) {
    try {
      const data = Buffer.from(rawAccount.account.data[0], 'base64');
      const accountType = data[0];

      console.log('DATA', rawAccount);

      const account: ProgramAccount<TAccount> = {
        pubkey: new PublicKey(rawAccount.pubkey),
        account: deserializeBorsh(getSchema(accountType), accountFactory, data),
        owner: rawAccount.account.owner,
      };

      accounts[account.pubkey.toBase58()] = account;
    } catch (ex) {
      console.info(
        `Can't deserialize ${accountFactory.name} @ ${rawAccount.pubkey}.`,
        getErrorMessage(ex),
      );
    }
  }

  return accounts;
}
