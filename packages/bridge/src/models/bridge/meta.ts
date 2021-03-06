/// chain id of the native chain of this asset
import * as BufferLayout from 'buffer-layout';

export const WrappedMetaLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8('chain'),
    BufferLayout.blob(32, 'address'),
    BufferLayout.u8('isInitialized'),
  ],
);
