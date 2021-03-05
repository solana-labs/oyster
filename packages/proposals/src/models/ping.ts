import { TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';

export const pingInstruction = (): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.Ping,
    },
    data,
  );

  const keys: never[] = [];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
