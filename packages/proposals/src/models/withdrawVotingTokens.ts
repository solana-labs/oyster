import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as Layout from '../utils/layout';

import * as BufferLayout from 'buffer-layout';
import { TimelockInstruction } from './timelock';
import BN from 'bn.js';

///   0. `[writable]` Initialized Voting account from which to remove your voting tokens.
///   1. `[writable]` Initialized Yes Voting account from which to remove your voting tokens.
///   2. `[writable]` Initialized No Voting account from which to remove your voting tokens.
///   3. `[writable]` Governance token account that you wish your actual tokens to be returned to.
///   4. `[writable]` Governance holding account owned by the timelock that will has the actual tokens in escrow.
///   5. `[writable]` Initialized Yes Voting dump account owned by timelock set to which to send your voting tokens.
///   6. `[writable]` Initialized No Voting dump account owned by timelock set to which to send your voting tokens.
///   7. `[]` Voting mint account.
///   8. `[]` Timelock state account.
///   9. `[]` Timelock set account.
///   10. `[]` Transfer authority
///   11. `[]` Yes Transfer authority
///   12. `[]` No Transfer authority
///   13. `[]` Timelock program mint authority
///   14. `[]` Timelock program account pub key.
///   15. `[]` Token program account.
export const withdrawVotingTokensInstruction = (
  votingAccount: PublicKey,
  yesVotingAccount: PublicKey,
  noVotingAccount: PublicKey,
  destinationAccount: PublicKey,
  sourceHoldingAccount: PublicKey,
  yesVotingDump: PublicKey,
  noVotingDump: PublicKey,
  votingMint: PublicKey,
  timelockStateAccount: PublicKey,
  timelockSetAccount: PublicKey,
  transferAuthority: PublicKey,
  yesTransferAuthority: PublicKey,
  noTransferAuthority: PublicKey,
  mintAuthority: PublicKey,
  votingTokenAmount: number,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('votingTokenAmount'),
  ]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: TimelockInstruction.WithdrawVotingTokens,
      votingTokenAmount: new BN(votingTokenAmount),
    },
    data,
  );

  const keys = [
    { pubkey: votingAccount, isSigner: false, isWritable: true },
    { pubkey: yesVotingAccount, isSigner: false, isWritable: true },
    { pubkey: noVotingAccount, isSigner: false, isWritable: true },
    { pubkey: destinationAccount, isSigner: false, isWritable: true },
    { pubkey: sourceHoldingAccount, isSigner: false, isWritable: true },
    { pubkey: yesVotingDump, isSigner: false, isWritable: true },
    { pubkey: noVotingDump, isSigner: false, isWritable: true },
    { pubkey: votingMint, isSigner: false, isWritable: true },
    { pubkey: timelockStateAccount, isSigner: false, isWritable: false },
    { pubkey: timelockSetAccount, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: false, isWritable: false },
    { pubkey: yesTransferAuthority, isSigner: false, isWritable: false },
    { pubkey: noTransferAuthority, isSigner: false, isWritable: false },
    { pubkey: mintAuthority, isSigner: false, isWritable: false },
    {
      pubkey: PROGRAM_IDS.timelock.programAccountId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.token, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.timelock.programId,
    data,
  });
};
