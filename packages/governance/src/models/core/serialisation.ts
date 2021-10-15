import { AccountInfo, PublicKey } from '@solana/web3.js';
import { deserializeBorsh, ParsedAccountBase } from '@oyster/common';

import { Schema } from 'borsh';

export function BorshAccountParser(
  classType: any,
  schema: Schema,
): (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase {
  return (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
    const buffer = Buffer.from(info.data);
    const data = deserializeBorsh(schema, classType, buffer);

    return {
      pubkey: pubKey,
      account: {
        ...info,
      },
      info: data,
    } as ParsedAccountBase;
  };
}
