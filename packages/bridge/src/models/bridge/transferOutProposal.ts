import * as BufferLayout from 'buffer-layout';

// 1184 TransferOutProposal
export const TransferOutProposalLayout = BufferLayout.struct([
  BufferLayout.blob(32, 'amount'),
  BufferLayout.u8('toChain'),
  BufferLayout.blob(32, 'sourceAddress'),
  BufferLayout.blob(32, 'targetAddress'),
  BufferLayout.blob(32, 'assetAddress'),
  BufferLayout.u8('assetChain'),
  BufferLayout.u8('assetDecimals'),
  BufferLayout.seq(BufferLayout.u8(), 1), // 4 byte alignment because a u32 is following
  BufferLayout.u32('nonce'),
  BufferLayout.blob(1001, 'vaa'),
  BufferLayout.seq(BufferLayout.u8(), 3), // 4 byte alignment because a u32 is following
  BufferLayout.u32('vaaTime'),
  BufferLayout.u32('lockupTime'),
  BufferLayout.u8('pokeCounter'),
  BufferLayout.blob(32, 'signatureAccount'),
  BufferLayout.u8('initialized'),
  BufferLayout.seq(BufferLayout.u8(), 2), // 2 byte alignment
]);
