// 44 - bridge config
import { Layout } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';

export const BridgeLayout: typeof BufferLayout.Structure = BufferLayout.struct([
  BufferLayout.u32('guardianSetIndex'),
  BufferLayout.u8('guardianSetExpirationTime'),
  Layout.publicKey('tokenProgram'),
  BufferLayout.u8('isInitialized'),
]);
