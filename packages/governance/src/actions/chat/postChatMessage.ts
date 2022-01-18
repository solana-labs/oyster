import {
  Account,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';

import { Proposal } from '@solana/spl-governance';

import { sendTransactionWithNotifications } from '../../tools/transactions';
import { RpcContext } from '@solana/spl-governance';
import { withPostChatMessage } from '@solana/spl-governance';
import { ChatMessageBody } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export const postChatMessage = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  proposal: ProgramAccount<Proposal>,
  tokeOwnerRecord: PublicKey,
  replyTo: PublicKey | undefined,
  body: ChatMessageBody,
) => {
  let signers: Keypair[] = [];
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
