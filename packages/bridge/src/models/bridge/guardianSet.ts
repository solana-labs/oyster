import * as BufferLayout from 'buffer-layout';

/// ForeignAddress u8 - 32

// 420
export const GuardianSetLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u32('index'),
    BufferLayout.u8('keysLength'),

    // TODO: decode keys
    BufferLayout.blob(406, 'keys'),

    BufferLayout.u32('creationTime'),
    BufferLayout.u32('expirationTime'),
    BufferLayout.u8('isInitialized'),
  ],
);
