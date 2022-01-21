import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

import { ProgramAccountWithType } from '../core/accounts';
import { Schema } from 'borsh';
import { getErrorMessage } from '../tools/script';
import { ProgramAccount } from '../tools/sdk/runtime';
import { deserializeBorsh } from '../tools/borsh';
import { WalletNotConnectedError, WalletSigner } from '../tools/walletAdapter';

// Context to make RPC calls for given clone programId, current connection, endpoint and wallet
export class RpcContext {
  constructor(
    public programId: PublicKey,
    public programVersion: number,
    public wallet: WalletSigner,
    public connection: Connection,
    public endpoint: string,
  ) {
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
  constructor(public offset: number, public bytes: Buffer) {
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

// PublicKey MemcmpFilter
export const pubkeyFilter = (
  offset: number,
  pubkey: PublicKey | undefined | null,
) => (!pubkey ? undefined : new MemcmpFilter(offset, pubkey.toBuffer()));

// Boolean MemcmpFilter
export const booleanFilter = (offset: number, value: boolean) =>
  new MemcmpFilter(offset, Buffer.from(value ? [1] : [0]));

export async function getBorshProgramAccounts<
  TAccount extends ProgramAccountWithType
>(
  connection: Connection,
  programId: PublicKey,
  getSchema: (accountType: number) => Schema,
  accountFactory: new (args: any) => TAccount,
  filters: MemcmpFilter[] = [],
  accountType?: number,
) {
  accountType = accountType ?? new accountFactory({}).accountType;

  const programAccounts = await connection.getProgramAccounts(programId, {
    commitment: connection.commitment,
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
  });

  let accounts: ProgramAccount<TAccount>[] = [];

  for (let rawAccount of programAccounts) {
    try {
      const data = rawAccount.account.data;
      const accountType = data[0];

      const account: ProgramAccount<TAccount> = {
        pubkey: new PublicKey(rawAccount.pubkey),
        account: deserializeBorsh(getSchema(accountType), accountFactory, data),
        owner: rawAccount.account.owner,
      };

      accounts.push(account);
    } catch (ex) {
      console.info(
        `Can't deserialize ${accountFactory.name} @ ${rawAccount.pubkey}.`,
        getErrorMessage(ex),
      );
    }
  }

  return accounts;
}
