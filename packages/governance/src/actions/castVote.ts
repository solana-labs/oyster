import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../models/accounts';
import { withCastVote } from '../models/withCastVote';
import { YesNoVote } from '../models/instructions';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';

export const castVote = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  vote: YesNoVote,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  await withCastVote(
    instructions,
    programId,
    programVersion,
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
