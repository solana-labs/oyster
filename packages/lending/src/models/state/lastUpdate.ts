import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';

export interface LastUpdate {
  slot: BN;
  stale: boolean;
}

export const LastUpdateLayout = BufferLayout.struct<LastUpdate>(
  [Layout.uint64('slot'), BufferLayout.u8('stale')],
  'lastUpdate'
);
