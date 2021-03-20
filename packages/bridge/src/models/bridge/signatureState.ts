// 1340 - SigState - (VerifySignatures - parameter 4)
// export const NOP = 0;

import * as BufferLayout from 'buffer-layout';

// 1184 TransferOutProposal
export const SignatureLayout = BufferLayout.struct([
  BufferLayout.blob(64 * 1000, 'signatures'),
  BufferLayout.blob(32, 'hash'),
  BufferLayout.u32('guardianSetIndex'),
  BufferLayout.u8('initialized'),
]);
