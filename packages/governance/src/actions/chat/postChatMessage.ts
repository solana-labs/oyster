import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '../../models/accounts';

import { sendTransactionWithNotifications } from '../../tools/transactions';
import { RpcContext } from '../../models/core/api';
import { withPostChatMessage } from '../../models/chat/withPostChatMessage';
import { ChatMessageBody } from '../../models/chat/accounts';
import { ProgramAccount } from '../../models/tools/solanaSdk';

export const postChatMessage = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
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
    proposal.account.governance,
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
