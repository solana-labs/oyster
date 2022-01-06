import { AccountInfo, PublicKey } from '@solana/web3.js';

import { Schema } from 'borsh';
import { deserializeBorsh } from '../tools/borsh';
import { ProgramAccount } from '../tools/solanaSdk';

export function BorshAccountParser(
  classType: any,
  getSchema: (accountType: number) => Schema,
): (pubKey: PublicKey, info: AccountInfo<Buffer>) => ProgramAccount<any> {
  return (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
    const buffer = Buffer.from(info.data);
    const data = deserializeBorsh(getSchema(info.data[0]), classType, buffer);

    return {
      pubkey: pubKey,
      owner: info.owner,
      account: data,
    } as ProgramAccount<any>;
  };
}
