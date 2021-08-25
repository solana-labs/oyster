import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ParsedAccount } from '@oyster/common';

import { Proposal } from '../../models/accounts';

import { sendTransactionWithNotifications } from '../../tools/transactions';
import { RpcContext } from '../../models/core/api';
import { withPostMessage } from '../../models/chat/withPostMessage';
import { MessageBody } from '../../models/chat/accounts';

export const postMessage = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ParsedAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  replyTo: PublicKey | undefined,
  body: MessageBody,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  let governanceAuthority = walletPubkey;
  let payer = walletPubkey;

  await withPostMessage(
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
    'Posting message',
    'Message post',
  );
};
