import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { Vote } from '../models/instructions';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/api';

export const castVote = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  vote: Vote,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  await withCastVote(
    instructions,
    programId,
    realm,
    proposal.info.governance,
    proposal.pubkey,
    proposal.info.tokenOwnerRecord,
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
