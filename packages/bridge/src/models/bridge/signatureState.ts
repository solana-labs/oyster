// 1340 - SigState - (VerifySignatures - parameter 4)
// export const NOP = 0;

// pub struct SignatureState {
//   /// signatures of validators
//   pub signatures: [[u8; 65]; MAX_LEN_GUARDIAN_KEYS],

//   /// hash of the data
//   pub hash: [u8; 32],

// }

import * as BufferLayout from 'buffer-layout';

// 1184 TransferOutProposal
export const SignatureLayout = BufferLayout.struct([
  BufferLayout.blob(64 * 1000, 'signatures'),
  BufferLayout.blob(32, 'hash'),
  BufferLayout.u32('guardianSetIndex'),
  BufferLayout.u8('initialized'),
]);
