import { utils } from '@oyster/common';
import {
  Account,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { GOVERNANCE_CHAT_SCHEMA } from './serialisation';
import { serialize } from 'borsh';
import { PostMessageArgs } from './instructions';
import { governanceChatProgramId, MessageBody } from './accounts';

export async function withPostMessage(
  instructions: TransactionInstruction[],
  signers: Account[],
  governanceProgramId: PublicKey,
  governance: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  payer: PublicKey,
  replyTo: PublicKey | undefined,
  body: MessageBody,
) {
  const { system: systemId } = utils.programIds();

  const args = new PostMessageArgs({
    body,
  });

  const data = Buffer.from(serialize(GOVERNANCE_CHAT_SCHEMA, args));

  const chatMessage = new PublicKey('');

  let keys = [
    {
      pubkey: governanceProgramId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governance,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: proposal,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: chatMessage,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: systemId,
      isWritable: false,
      isSigner: false,
    },
  ];

  if (replyTo) {
    keys.push({
      pubkey: replyTo,
      isWritable: false,
      isSigner: false,
    });
  }

  instructions.push(
    new TransactionInstruction({
      keys,
      programId: governanceChatProgramId,
      data,
    }),
  );
}
