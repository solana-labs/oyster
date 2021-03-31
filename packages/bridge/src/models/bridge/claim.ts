import { publicKey } from '@oyster/common/dist/lib/utils/layout';
import * as BufferLayout from 'buffer-layout';

export const ClaimedVAA = BufferLayout.struct([
  BufferLayout.blob(32, 'hash'),
  BufferLayout.u32('vaaTime'),
  BufferLayout.u8('is_initialized'),
]);

/*
pub struct ClaimedVAA {

    /// hash of the vaa
    pub hash: [u8; 32],

    /// time the vaa was submitted
    pub vaa_time: u32,

    /// Is `true` if this structure has been initialized.
    pub is_initialized: bool,
}
*/
