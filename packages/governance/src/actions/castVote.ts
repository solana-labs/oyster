import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote } from '../models/instructions';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const castVote = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  vote: Vote,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = wallet.publicKey;
  let payer = wallet.publicKey;

  await withCastVote(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    tokeOwnerRecord,
    governanceAuthority,
    proposal.info.governingTokenMint,
    vote,
    payer,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Voting on proposal',
    'Proposal voted on',
  );
};
