import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { BorshClass } from '../tools/borsh';

export const GOVERNANCE_CHAT_PROGRAM_ID = new PublicKey(
  'gCHAtYKrUUktTVzE4hEnZdLV4LXrdBf6Hh9qMaJALET',
);

export enum GovernanceChatAccountType {
  Uninitialized = 0,
  ChatMessage = 1,
}

export interface GovernanceChatAccount {
  accountType: GovernanceChatAccountType;
}

export type GovernanceChatAccountClass = typeof ChatMessage;

export enum ChatMessageBodyType {
  Text = 0,
  Reaction = 1,
}

export interface ChatMessageBody {
  type: ChatMessageBodyType;
  value: string;
}
export class ChatMessageBody extends BorshClass<ChatMessageBody> {}

interface ChatMessageProps {
  proposal: PublicKey;
  author: PublicKey;
  postedAt: BN;
  replyTo?: PublicKey;
  body: ChatMessageBody;
}
export interface ChatMessage extends ChatMessageProps {}
export class ChatMessage extends BorshClass<ChatMessageProps> {
  accountType = GovernanceChatAccountType.ChatMessage;
}
