import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Proposal } from '@solana/governance-sdk';

import { sendTransactionWithNotifications } from '../../tools/transactions';
import { RpcContext } from '@solana/governance-sdk';
import { withPostChatMessage } from '@solana/governance-sdk';
import { ChatMessageBody } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

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
