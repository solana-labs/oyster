import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../../models/accounts';

import { sendTransactionWithNotifications } from '../../tools/transactions';
import { RpcContext } from '../../models/core/api';
import { withPostChatMessage } from '../../models/chat/withPostChatMessage';
import { ChatMessageBody } from '../../models/chat/accounts';

export const postChatMessage = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  replyTo: PublicKey | undefined,
  body: ChatMessageBody,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  await withPostChatMessage(
    instructions,
    signers,
    programId,
    proposal.info.governance,
    proposal.pubkey,
    tokeOwnerRecord,
    governanceAuthority,
    payer,
    replyTo,
    body,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Posting comment',
    'Comment post',
  );
};
